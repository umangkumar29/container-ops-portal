from fastapi import APIRouter, HTTPException, Depends
from core.config import get_settings, Settings
from azure.identity import ClientSecretCredential
from azure.mgmt.resource import ResourceManagementClient
from azure.mgmt.appcontainers import ContainerAppsAPIClient

router = APIRouter(prefix="/azure", tags=["Azure Discovery"])

def get_azure_credentials(settings: Settings = Depends(get_settings)):
    if not all([settings.azure_tenant_id, settings.azure_client_id, settings.azure_client_secret, settings.azure_subscription_id]):
        raise HTTPException(status_code=500, detail="Azure credentials are not fully configured in backend.")
    
    credential = ClientSecretCredential(
        tenant_id=settings.azure_tenant_id,
        client_id=settings.azure_client_id,
        client_secret=settings.azure_client_secret
    )
    return credential, settings.azure_subscription_id

@router.get("/resource-groups", response_model=list[str])
def list_resource_groups(creds_data: tuple = Depends(get_azure_credentials)):
    credential, subscription_id = creds_data
    try:
        resource_client = ResourceManagementClient(credential, subscription_id)
        rg_list = resource_client.resource_groups.list()
        return [rg.name for rg in rg_list]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resource-groups/{resource_group_name}/container-apps", response_model=list[str])
def list_container_apps(resource_group_name: str, creds_data: tuple = Depends(get_azure_credentials)):
    credential, subscription_id = creds_data
    try:
        app_client = ContainerAppsAPIClient(credential, subscription_id)
        # Using the standard container_apps property of ContainerAppsAPIClient
        apps_list = app_client.container_apps.list_by_resource_group(resource_group_name)
        return [app.name for app in apps_list]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
