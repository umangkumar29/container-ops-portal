"""
Azure credential resolution for user-delegated access.

Flow:
1. **User Bearer Token** (primary) — the frontend logs the user in via Microsoft AD
   (MSAL), acquires an ARM-scoped token, and sends it as ``Authorization: Bearer``
   on every request.  The backend wraps it and passes it directly to the Azure SDK.
   Azure then enforces the user's own RBAC — they can only see/act on what their
   company account is permitted to.

2. **Azure CLI fallback** (local development only) — if no Bearer header is present
   (e.g. a developer testing via curl or Swagger after running ``az login``), the
   cached CLI session is used.  No service principal or client secret is ever needed.
"""

from __future__ import annotations

import logging
import time

from azure.core.credentials import AccessToken, TokenCredential
from azure.core.exceptions import ClientAuthenticationError
from azure.identity import AzureCliCredential, CredentialUnavailableError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import Settings, get_settings

logger = logging.getLogger(__name__)

# auto_error=False — we handle missing header ourselves to provide a useful 401
_bearer_scheme = HTTPBearer(auto_error=False)


class _BearerTokenCredential:
    """
    Wraps a raw ARM Bearer token acquired by the frontend via MSAL so that the
    Azure SDK can consume it as a standard ``TokenCredential``.

    The token is already validated by Microsoft's identity platform before it
    reaches here; we simply return it whenever the SDK asks for one.
    """

    def __init__(self, token: str) -> None:
        self._token = token

    def get_token(self, *_scopes: str, **_kwargs) -> AccessToken:  # type: ignore[override]
        # We don't parse the JWT — use now + 1 h as a safe upper-bound expiry.
        return AccessToken(self._token, int(time.time()) + 3600)


def get_azure_credential(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> TokenCredential:
    """
    FastAPI dependency that returns an Azure ``TokenCredential`` for each request.

    Priority:
    1. Bearer token from the ``Authorization`` header  → user's own RBAC applies
    2. Azure CLI session (``az login``)                → local development fallback
    3. HTTP 401                                        → neither is available
    """

    # ── 1. User Bearer Token from MSAL login ─────────────────────────────────
    if credentials and credentials.credentials:
        logger.debug("Azure credential: Bearer token from Authorization header (user login)")
        return _BearerTokenCredential(credentials.credentials)

    # ── 2. Azure CLI session (local dev) ─────────────────────────────────────
    try:
        cli_cred = AzureCliCredential(tenant_id=settings.azure_tenant_id)
        # Validate eagerly so we get a clear error rather than failing mid-request.
        cli_cred.get_token("https://management.azure.com/.default")
        logger.debug("Azure credential: AzureCliCredential (az login session)")
        return cli_cred
    except (CredentialUnavailableError, ClientAuthenticationError) as exc:
        logger.debug("Azure CLI credential unavailable: %s", exc)

    # ── 3. Nothing worked ─────────────────────────────────────────────────────
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=(
            "Not authenticated. Please log in via the portal. "
            "For local development, run 'az login' in your terminal first."
        ),
    )