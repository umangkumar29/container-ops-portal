"""
Azure credential resolution prioritising the local Azure CLI session.

Priority order:
1. **Azure CLI** — reuse the token cached by ``az login`` so developers can work
   with their own RBAC permissions.
2. **Service Principal fallback** — if ``AZURE_CLIENT_ID`` / ``AZURE_CLIENT_SECRET`` /
   ``AZURE_TENANT_ID`` are present, fall back to :class:`ClientSecretCredential`.
3. Otherwise surface a 401 with guidance on running ``az login`` or setting the
   service-principal environment variables.
"""

from __future__ import annotations

import logging

from azure.core.credentials import TokenCredential
from azure.core.exceptions import ClientAuthenticationError
from azure.identity import AzureCliCredential, ClientSecretCredential, CredentialUnavailableError
from fastapi import Depends, HTTPException, status

from core.config import Settings, get_settings

logger = logging.getLogger(__name__)


def _cli_credential(tenant_id: str | None) -> TokenCredential:
    """Return an Azure CLI credential, optionally scoped to a tenant."""
    return AzureCliCredential(tenant_id=tenant_id)


def get_azure_credential(
    settings: Settings = Depends(get_settings),
) -> TokenCredential:
    """
    Return an Azure credential using either the developer's Azure CLI session or a Service Principal.
    """

    # 1. Try the local Azure CLI cache first (developers run `az login` once).
    try:
        cli_credential = _cli_credential(settings.azure_tenant_id)
        # Proactively validate that the CLI session is available to provide clearer errors.
        cli_credential.get_token("https://management.azure.com/.default")
        logger.debug("Azure credential: AzureCliCredential (az login cache)")
        return cli_credential
    except (CredentialUnavailableError, ClientAuthenticationError) as exc:
        logger.debug("Azure CLI credential unavailable: %s", exc, exc_info=True)

    # 2. Fall back to Service Principal if fully configured.
    sp_vars = (
        settings.azure_tenant_id,
        settings.azure_client_id,
        settings.azure_client_secret,
    )
    if all(sp_vars):
        logger.debug("Azure credential: ClientSecretCredential (service principal)")
        return ClientSecretCredential(
            tenant_id=settings.azure_tenant_id,
            client_id=settings.azure_client_id,
            client_secret=settings.azure_client_secret,
        )

    # 3. Nothing worked, tell the caller how to fix it.
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=(
            "No Azure credential available. "
            "Run 'az login' to authenticate with your user account, or configure "
            "AZURE_CLIENT_ID / AZURE_CLIENT_SECRET / AZURE_TENANT_ID for service-principal access."
        ),
    )

 