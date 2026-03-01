from fastapi import APIRouter, HTTPException, Depends
from core.config import get_settings, Settings
from azure.identity import ClientSecretCredential
from azure.mgmt.costmanagement import CostManagementClient
from azure.mgmt.costmanagement.models import QueryDefinition, QueryTimePeriod, QueryDataset, QueryAggregation, QueryGrouping
import datetime
from api.dependencies import get_environment_service
from services import EnvironmentService
from pydantic import BaseModel

from typing import List, Optional

router = APIRouter(prefix="/cost", tags=["Cost Management"])

class DailyCost(BaseModel):
    date: str
    cost: float

class CostResponse(BaseModel):
    currency: str
    total_cost: float
    granularity: str
    last_updated: Optional[str] = None
    daily_costs: List[DailyCost] = []

def get_azure_credentials(settings: Settings = Depends(get_settings)):
    if not all([settings.azure_tenant_id, settings.azure_client_id, settings.azure_client_secret, settings.azure_subscription_id]):
        raise HTTPException(status_code=500, detail="Azure credentials are not fully configured in backend.")
    
    credential = ClientSecretCredential(
        tenant_id=settings.azure_tenant_id,
        client_id=settings.azure_client_id,
        client_secret=settings.azure_client_secret
    )
    return credential, settings.azure_subscription_id

@router.get("/app/{env_id}", response_model=CostResponse)
def get_app_cost(
    env_id: int, 
    days: int = 30,
    service: EnvironmentService = Depends(get_environment_service),
    creds_data: tuple = Depends(get_azure_credentials)
):
    """
    Get cost data for an application environment. 
    Note: Azure Cost Management data is typically delayed by 24 to 48 hours.
    """
    environment = service.get_environment(env_id)
    if environment is None:
        raise HTTPException(status_code=404, detail="Environment not found.")

    credential, subscription_id = creds_data
    
    # Cost Management API scope is the resource group for specific apps
    scope = f"/subscriptions/{subscription_id}/resourceGroups/{environment.resource_group}/providers/Microsoft.App/containerApps/{environment.app_name}"

    try:
        cost_client = CostManagementClient(credential)
        
        # Look back 'x' days from today
        end_date = datetime.datetime.now(datetime.timezone.utc)
        start_date = end_date - datetime.timedelta(days=days)

        query = QueryDefinition(
            type="Usage",
            timeframe="Custom",
            time_period=QueryTimePeriod(
                from_property=start_date,
                to=end_date
            ),
            dataset=QueryDataset(
                granularity="Daily", # Get day-by-day breakdown
                aggregation={
                    "totalCost": QueryAggregation(
                        name="PreTaxCost",
                        function="Sum"
                    )
                },
                grouping=[
                    QueryGrouping(
                        type="Dimension",
                        name="ChargeType"
                    )
                ]
            )
        )

        result = cost_client.query.usage(scope, query)
        
        # Parse the custom Azure QueryResult
        # Rows format with Daily granularity: [[cost, usageDate, chargeType, currency]]
        total_cost = 0.0
        currency = "INR" # Or dynamically parse it from result
        daily_costs_dict = {}
        last_date = None
        
        if result.rows:
            for row in result.rows:
                cost_val = float(row[0])
                date_str = str(row[1]) # format: YYYYMMDD
                currency = str(row[3])
                
                # Format date string nicely
                formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"
                
                if formatted_date not in daily_costs_dict:
                    daily_costs_dict[formatted_date] = 0.0
                
                daily_costs_dict[formatted_date] += cost_val
                
                if (not last_date or formatted_date > last_date) and cost_val > 0:
                    last_date = formatted_date
                
                total_cost += cost_val

        # Sort daily costs by date
        sorted_daily_costs = [
            DailyCost(date=k, cost=round(v, 2)) 
            for k, v in sorted(daily_costs_dict.items())
        ]

        return CostResponse(
            currency=currency,
            total_cost=round(total_cost, 2),
            granularity=f"{days} Days",
            last_updated=last_date,
            daily_costs=sorted_daily_costs
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Azure Cost Management Error: {str(e)}")
