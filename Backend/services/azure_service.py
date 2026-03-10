import asyncio
import logging
from typing import Optional
 
from azure.core.credentials import TokenCredential
from azure.mgmt.appcontainers import ContainerAppsAPIClient
from azure.mgmt.appcontainers.models import ContainerApp
 
logger = logging.getLogger(__name__)
 
 
class AzureContainerAppService:
    """Wrapper around the Azure Container Apps SDK with async-friendly helpers.
 
    Accepts any ``TokenCredential`` - works with Azure CLI sessions (via ``az login``)
    and service principal credentials alike.
    """
 
    def __init__(self, credential: TokenCredential, subscription_id: str) -> None:
        self._credential = credential
        self._subscription_id = subscription_id
 
    def _build_client(self) -> ContainerAppsAPIClient:
        return ContainerAppsAPIClient(
            credential=self._credential,
            subscription_id=self._subscription_id,
        )
 
    async def get_app_status(self, resource_group: str, app_name: str) -> str:
        """Return the running/provisioning state for a container app."""
        client = self._build_client()
 
        def _invoke() -> Optional[ContainerApp]:
            return client.container_apps.get(resource_group, app_name)
 
        try:
            app = await asyncio.to_thread(_invoke)
            if app is None:
                return "Unknown"
 
            status = getattr(app, "running_status", None)
            if not status or status.lower() == "unknown":
                status = getattr(app, "provisioning_state", "Unknown")
 
            return status
        except Exception:  # noqa: BLE001
            logger.exception("Error fetching status for app '%s'", app_name)
            return "Error"
 
    async def restart_app(self, resource_group: str, app_name: str) -> bool:
        """Restart (stop then start) an Azure Container App."""
        client = self._build_client()
        try:
            await asyncio.to_thread(lambda: client.container_apps.begin_stop(resource_group, app_name).wait())
            await asyncio.to_thread(lambda: client.container_apps.begin_start(resource_group, app_name).wait())
            return True
        except Exception:  # noqa: BLE001
            logger.exception("Error restarting app '%s'", app_name)
            return False
 
    async def stop_app(self, resource_group: str, app_name: str) -> bool:
        """Stop an Azure Container App."""
        client = self._build_client()
        try:
            await asyncio.to_thread(lambda: client.container_apps.begin_stop(resource_group, app_name).wait())
            return True
        except Exception:  # noqa: BLE001
            logger.exception("Error stopping app '%s'", app_name)
            return False
 
    async def start_app(self, resource_group: str, app_name: str) -> bool:
        """Start an Azure Container App."""
        client = self._build_client()
        try:
            await asyncio.to_thread(lambda: client.container_apps.begin_start(resource_group, app_name).wait())
            return True
        except Exception:  # noqa: BLE001
            logger.exception("Error starting app '%s'", app_name)
            return False
 
 
 