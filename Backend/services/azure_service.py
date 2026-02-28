import asyncio
import logging
from typing import Optional

from azure.identity import ClientSecretCredential
from azure.mgmt.appcontainers import ContainerAppsAPIClient
from azure.mgmt.appcontainers.models import ContainerApp

from core import Settings

logger = logging.getLogger(__name__)


class AzureContainerAppService:
    """Wrapper around the Azure Container Apps SDK with async-friendly helpers."""

    def __init__(self, settings: Settings):
        self._settings = settings

    def _build_client(self) -> Optional[ContainerAppsAPIClient]:
        required_values = (
            self._settings.azure_tenant_id,
            self._settings.azure_client_id,
            self._settings.azure_client_secret,
            self._settings.azure_subscription_id,
        )
        if not all(required_values):
            return None

        credential = ClientSecretCredential(
            tenant_id=self._settings.azure_tenant_id,
            client_id=self._settings.azure_client_id,
            client_secret=self._settings.azure_client_secret,
        )
        return ContainerAppsAPIClient(
            credential=credential,
            subscription_id=self._settings.azure_subscription_id,
        )

    async def get_app_status(self, resource_group: str, app_name: str) -> str:
        """Return the provisioning state for a container app."""
        client = self._build_client()
        if client is None:
            return "Not Configured"

        def _invoke() -> Optional[ContainerApp]:
            return client.container_apps.get(resource_group, app_name)

        try:
            app = await asyncio.to_thread(_invoke)
            if app is None:
                return "Unknown"
            
            # Prefer running_status (Running, Stopped), fallback to provisioning_state
            status = getattr(app, "running_status", None)
            if not status or status.lower() == "unknown":
                status = getattr(app, "provisioning_state", "Unknown")
                
            return status
        except Exception:  # noqa: BLE001
            logger.exception("Error fetching status for app '%s'", app_name)
            return "Error"

    async def restart_app(self, resource_group: str, app_name: str) -> bool:
        """Restart (stop/start) an Azure Container App."""
        client = self._build_client()
        if client is None:
            return False

        def _stop():
            poller = client.container_apps.begin_stop(resource_group, app_name)
            poller.wait()

        def _start():
            poller = client.container_apps.begin_start(resource_group, app_name)
            poller.wait()

        try:
            await asyncio.to_thread(_stop)
            await asyncio.to_thread(_start)
            return True
        except Exception:  # noqa: BLE001
            logger.exception("Error restarting app '%s'", app_name)
            return False

    async def stop_app(self, resource_group: str, app_name: str) -> bool:
        """Stop an Azure Container App."""
        client = self._build_client()
        if client is None:
            return False

        def _stop():
            poller = client.container_apps.begin_stop(resource_group, app_name)
            poller.wait()

        try:
            await asyncio.to_thread(_stop)
            return True
        except Exception:  # noqa: BLE001
            logger.exception("Error stopping app '%s'", app_name)
            return False
