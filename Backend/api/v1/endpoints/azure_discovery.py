import asyncio
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from azure.identity import ClientSecretCredential
from azure.mgmt.subscription import SubscriptionClient
from azure.mgmt.appcontainers import ContainerAppsAPIClient

from core.config import get_settings, Settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/azure", tags=["Azure Auto-Discovery"])

def get_azure_credentials(settings: Settings = Depends(get_settings)):
    if not all([settings.azure_tenant_id, settings.azure_client_id, settings.azure_client_secret]):
        raise HTTPException(
            status_code=500, 
            detail="Azure credentials (tenant, client_id, client_secret) are not fully configured."
        )
    
    credential = ClientSecretCredential(
        tenant_id=settings.azure_tenant_id,
        client_id=settings.azure_client_id,
        client_secret=settings.azure_client_secret
    )
    return credential

@router.get("/discover-all", response_model=list[dict[str, Any]])
async def discover_all_apps(credential = Depends(get_azure_credentials)):
    """
    True Auto-Discovery:
    1. Finds all subscriptions the Service Principal has access to.
    2. Finds all container apps across those subscriptions.
    """
    try:
        sub_client = SubscriptionClient(credential)
        def _get_subs():
            return list(sub_client.subscriptions.list())
        
        subscriptions = await asyncio.to_thread(_get_subs)
        
        all_apps = []
        for sub in subscriptions:
            app_client = ContainerAppsAPIClient(credential, sub.subscription_id)
            
            def _get_apps():
                return list(app_client.container_apps.list_by_subscription())
            
            apps = await asyncio.to_thread(_get_apps)
            
            for app in apps:
                # ARM ID format: /subscriptions/{subId}/resourceGroups/{rg}/providers/Microsoft.App/containerApps/{name}
                parts = app.id.split('/')
                rg_name = 'Unknown'
                if 'resourceGroups' in parts:
                    rg_name = parts[parts.index('resourceGroups') + 1]
                
                # Preferred properties
                running_status = getattr(app, "running_status", None)
                if not running_status or str(running_status).lower() == "unknown":
                    running_status = getattr(app, "provisioning_state", "Unknown")

                all_apps.append({
                    "id": app.id,
                    "name": app.name,
                    "resourceGroup": rg_name,
                    "subscriptionId": sub.subscription_id,
                    "subscriptionName": getattr(sub, "display_name", sub.subscription_id),
                    "status": str(running_status)
                })
        
        return all_apps

    except Exception as e:
        logger.exception("Failed during auto-discovery")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{subscription_id}/{resource_group}/{app_name}/start")
async def start_app(subscription_id: str, resource_group: str, app_name: str, credential = Depends(get_azure_credentials)):
    try:
        client = ContainerAppsAPIClient(credential, subscription_id)
        def _start():
            client.container_apps.begin_start(resource_group, app_name).wait()
        await asyncio.to_thread(_start)
        return {"status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{subscription_id}/{resource_group}/{app_name}/stop")
async def stop_app(subscription_id: str, resource_group: str, app_name: str, credential = Depends(get_azure_credentials)):
    try:
        client = ContainerAppsAPIClient(credential, subscription_id)
        def _stop():
            client.container_apps.begin_stop(resource_group, app_name).wait()
        await asyncio.to_thread(_stop)
        return {"status": "stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{subscription_id}/{resource_group}/{app_name}/restart")
async def restart_app(subscription_id: str, resource_group: str, app_name: str, credential = Depends(get_azure_credentials)):
    try:
        client = ContainerAppsAPIClient(credential, subscription_id)
        def _restart():
            # Standard approach is stop then start
            client.container_apps.begin_stop(resource_group, app_name).wait()
            client.container_apps.begin_start(resource_group, app_name).wait()
        await asyncio.to_thread(_restart)
        return {"status": "restarted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
