import asyncio
import datetime
import logging
import threading
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from azure.mgmt.costmanagement import CostManagementClient
from azure.mgmt.costmanagement.models import (
    QueryDefinition,
    QueryTimePeriod,
    QueryDataset,
    QueryAggregation,
    QueryGrouping,
)

from core import Settings, get_azure_credential, get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cost", tags=["Cost Management"])


class DailyCost(BaseModel):
    date: str
    cost: float


class AppCost(BaseModel):
    app_name: str
    cost: float


class CostResponse(BaseModel):
    currency: str
    total_cost: float
    scope: str
    last_updated: Optional[str] = None
    daily_costs: List[DailyCost] = []
    per_app_costs: List[AppCost] = []


_cost_cache: dict[str, tuple[datetime.datetime, CostResponse]] = {}
_cost_cache_lock = threading.Lock()


def _copy_model(model: BaseModel) -> BaseModel:
    if hasattr(model, "model_copy"):
        return model.model_copy(deep=True)  # type: ignore[attr-defined]
    return model.copy(deep=True)  # type: ignore[attr-defined]


def _get_cached_response(cache_key: str, ttl_seconds: int) -> Optional[CostResponse]:
    if ttl_seconds <= 0:
        return None
    now = datetime.datetime.now(datetime.timezone.utc)
    with _cost_cache_lock:
        entry = _cost_cache.get(cache_key)
        if not entry:
            return None
        timestamp, response = entry
        if (now - timestamp).total_seconds() > ttl_seconds:
            del _cost_cache[cache_key]
            return None
        return _copy_model(response)


def _set_cached_response(cache_key: str, ttl_seconds: int, value: CostResponse) -> None:
    if ttl_seconds <= 0:
        return
    with _cost_cache_lock:
        _cost_cache[cache_key] = (datetime.datetime.now(datetime.timezone.utc), _copy_model(value))


def _seconds_until_end_of_day(now: datetime.datetime) -> int:
    """Return seconds remaining until the next UTC midnight."""
    tomorrow = (now + datetime.timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    seconds = int((tomorrow - now).total_seconds())
    return max(seconds, 0)


def _daily_cache_key(base_key: str, now: datetime.datetime) -> str:
    """Partition cache keys by UTC day to limit calls to once per day."""
    return f"{now.date().isoformat()}::{base_key}"


def _effective_cache_ttl(now: datetime.datetime, settings: Settings) -> int:
    """
    Ensure cost queries stay cached for the rest of the UTC day.
    Honors explicit disabling by leaving TTL at 0 when configured.
    """
    configured_ttl = settings.cost_cache_ttl_seconds
    if configured_ttl <= 0:
        return 0
    # Keep the cache warm until the end of the day, even if the configured TTL is shorter.
    return max(configured_ttl, _seconds_until_end_of_day(now))


def _build_query(start: datetime.datetime, end: datetime.datetime, group_by_resource: bool = False) -> QueryDefinition:
    grouping = []
    if group_by_resource:
        grouping.append(QueryGrouping(type="Dimension", name="ResourceId"))

    return QueryDefinition(
        type="Usage",
        timeframe="Custom",
        time_period=QueryTimePeriod(from_property=start, to=end),
        dataset=QueryDataset(
            granularity="Daily",
            aggregation={
                "totalCost": QueryAggregation(name="PreTaxCost", function="Sum")
            },
            grouping=grouping if grouping else None,
        ),
    )


def _parse_rows(rows, has_resource_group: bool = False):
    """
    Parse Azure Cost Management query rows.
    Without grouping: [cost, usageDate, currency]
    With ResourceId grouping: [cost, usageDate, resourceId, currency]
    """
    total_cost = 0.0
    currency = "USD"
    daily_costs_dict: dict[str, float] = {}
    resource_costs_dict: dict[str, float] = {}
    last_date = None

    if not rows:
        return total_cost, currency, daily_costs_dict, resource_costs_dict, last_date

    for row in rows:
        cost_val = float(row[0])
        date_str = str(row[1])
        formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"

        if has_resource_group:
            resource_id = str(row[2]) if len(row) > 2 else "unknown"
            currency = str(row[3]) if len(row) > 3 and row[3] else currency
            # Extract just the resource name from the full resource ID
            app_name = resource_id.split("/")[-1] if "/" in resource_id else resource_id
            resource_costs_dict[app_name] = resource_costs_dict.get(app_name, 0.0) + cost_val
        else:
            currency = str(row[2]) if len(row) > 2 and row[2] else currency

        daily_costs_dict[formatted_date] = daily_costs_dict.get(formatted_date, 0.0) + cost_val
        if (not last_date or formatted_date > last_date) and cost_val > 0:
            last_date = formatted_date
        total_cost += cost_val

    return total_cost, currency, daily_costs_dict, resource_costs_dict, last_date


@router.get("/subscription/{subscription_id}", response_model=CostResponse)
async def get_subscription_cost(
    subscription_id: str,
    credential=Depends(get_azure_credential),
    settings: Settings = Depends(get_settings),
):
    """
    Get Month-To-Date cost for a given Azure subscription.
    Note: Azure Cost Management data is typically delayed by 24-48 hours.
    """
    scope = f"/subscriptions/{subscription_id}"
    now = datetime.datetime.now(datetime.timezone.utc)
    effective_ttl = _effective_cache_ttl(now, settings)
    cache_key = _daily_cache_key(f"subscription:{subscription_id}", now)
    cached_response = _get_cached_response(cache_key, effective_ttl)
    if cached_response:
        logger.debug("Returning cached subscription cost for '%s' from cache", subscription_id)
        return cached_response

    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    query = _build_query(start_of_month, now, group_by_resource=False)

    try:
        cost_client = CostManagementClient(credential)
        result = await asyncio.to_thread(lambda: cost_client.query.usage(scope, query))

        total_cost, currency, daily_costs_dict, _, last_date = _parse_rows(result.rows or [], has_resource_group=False)

        response = CostResponse(
            currency=currency,
            total_cost=round(total_cost, 2),
            scope=scope,
            last_updated=last_date,
            daily_costs=[DailyCost(date=k, cost=round(v, 2)) for k, v in sorted(daily_costs_dict.items())],
        )
        _set_cached_response(cache_key, effective_ttl, response)

        return response

    except Exception as e:
        logger.exception("Error fetching cost for subscription '%s'", subscription_id)
        raise HTTPException(status_code=500, detail=f"Azure Cost Management Error: {str(e)}")


@router.get("/resource-group/{subscription_id}/{resource_group}", response_model=CostResponse)
async def get_resource_group_cost(
    subscription_id: str,
    resource_group: str,
    days: int = 30,
    credential=Depends(get_azure_credential),
    settings: Settings = Depends(get_settings),
):
    """
    Get cost breakdown for a specific Resource Group, grouped per container app.
    Note: Azure Cost Management data is typically delayed by 24-48 hours.
    """
    scope = f"/subscriptions/{subscription_id}/resourceGroups/{resource_group}"
    now = datetime.datetime.now(datetime.timezone.utc)
    start = now - datetime.timedelta(days=days)
    effective_ttl = _effective_cache_ttl(now, settings)
    cache_key = _daily_cache_key(f"resource-group:{subscription_id}:{resource_group}:{days}", now)
    cached_response = _get_cached_response(cache_key, effective_ttl)
    if cached_response:
        logger.debug(
            "Returning cached resource group cost for '%s/%s' (days=%d)",
            subscription_id,
            resource_group,
            days,
        )
        return cached_response

    # Query 1: daily total for the RG (no grouping)
    daily_query = _build_query(start, now, group_by_resource=False)
    # Query 2: per-app breakdown (group by ResourceId)
    app_query = _build_query(start, now, group_by_resource=True)

    try:
        cost_client = CostManagementClient(credential)

        daily_result, app_result = await asyncio.gather(
            asyncio.to_thread(lambda: cost_client.query.usage(scope, daily_query)),
            asyncio.to_thread(lambda: cost_client.query.usage(scope, app_query)),
        )

        total_cost, currency, daily_costs_dict, _, last_date = _parse_rows(daily_result.rows or [], has_resource_group=False)
        _, _, _, resource_costs_dict, _ = _parse_rows(app_result.rows or [], has_resource_group=True)

        per_app = [
            AppCost(app_name=name, cost=round(cost, 2))
            for name, cost in sorted(resource_costs_dict.items(), key=lambda x: x[1], reverse=True)
        ]

        response = CostResponse(
            currency=currency,
            total_cost=round(total_cost, 2),
            scope=scope,
            last_updated=last_date,
            daily_costs=[DailyCost(date=k, cost=round(v, 2)) for k, v in sorted(daily_costs_dict.items())],
            per_app_costs=per_app,
        )
        _set_cached_response(cache_key, effective_ttl, response)

        return response

    except Exception as e:
        logger.exception("Error fetching cost for RG '%s' in sub '%s'", resource_group, subscription_id)
        raise HTTPException(status_code=500, detail=f"Azure Cost Management Error: {str(e)}")
 