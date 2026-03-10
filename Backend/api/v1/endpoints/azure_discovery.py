import asyncio
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from azure.core.credentials import TokenCredential
from azure.mgmt.subscription import SubscriptionClient
from azure.mgmt.appcontainers import ContainerAppsAPIClient

from core import get_azure_credential

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/azure", tags=["Azure Auto-Discovery"])


@router.get("/discover-all", response_model=list[dict[str, Any]])
async def discover_all_apps(credential: TokenCredential = Depends(get_azure_credential)):
    """
    Auto-Discovery (dual-mode):
    1. Authenticates via the developer's `az login` session (preferred) or a service principal.
    2. Finds all subscriptions visible to that identity.
    3. Finds all container apps across those subscriptions.
    """
    try:
        sub_client = SubscriptionClient(credential)
        def _get_subs():
            return list(sub_client.subscriptions.list())

        subscriptions = await asyncio.to_thread(_get_subs)

        all_apps = []
        for sub in subscriptions:
            app_client = ContainerAppsAPIClient(credential, sub.subscription_id)

            # Bind app_client as a default arg to avoid the loop-closure bug
            def _get_apps(_client=app_client):
                return list(_client.container_apps.list_by_subscription())

            apps = await asyncio.to_thread(_get_apps)

            for app in apps:
                # ARM ID: /subscriptions/{id}/resourceGroups/{rg}/providers/...
                parts = app.id.split('/')
                rg_name = parts[parts.index('resourceGroups') + 1] if 'resourceGroups' in parts else 'Unknown'

                running_status = getattr(app, "running_status", None)
                if not running_status or str(running_status).lower() == "unknown":
                    running_status = getattr(app, "provisioning_state", "Unknown")

                all_apps.append({
                    "id": app.id,
                    "name": app.name,
                    "resourceGroup": rg_name,
                    "subscriptionId": sub.subscription_id,
                    "subscriptionName": getattr(sub, "display_name", sub.subscription_id),
                    "status": str(running_status),
                })

        return all_apps

    except Exception as e:
        logger.exception("Failed during auto-discovery")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{subscription_id}/{resource_group}/{app_name}/start")
async def start_app(
    subscription_id: str, resource_group: str, app_name: str,
    credential: TokenCredential = Depends(get_azure_credential),
):
    try:
        client = ContainerAppsAPIClient(credential, subscription_id)
        await asyncio.to_thread(lambda: client.container_apps.begin_start(resource_group, app_name).wait())
        return {"status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{subscription_id}/{resource_group}/{app_name}/stop")
async def stop_app(
    subscription_id: str, resource_group: str, app_name: str,
    credential: TokenCredential = Depends(get_azure_credential),
):
    try:
        client = ContainerAppsAPIClient(credential, subscription_id)
        await asyncio.to_thread(lambda: client.container_apps.begin_stop(resource_group, app_name).wait())
        return {"status": "stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{subscription_id}/{resource_group}/{app_name}/restart")
async def restart_app(
    subscription_id: str, resource_group: str, app_name: str,
    credential: TokenCredential = Depends(get_azure_credential),
):
    try:
        client = ContainerAppsAPIClient(credential, subscription_id)
        def _restart():
            client.container_apps.begin_stop(resource_group, app_name).wait()
            client.container_apps.begin_start(resource_group, app_name).wait()
        await asyncio.to_thread(_restart)
        return {"status": "restarted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
 