import asyncio
import logging
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from azure.core.credentials import TokenCredential
from datetime import datetime, timedelta, timezone

from core import get_azure_credential

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/logs", tags=["Container App Logs"])


class LogEntry(BaseModel):
    timestamp: str
    level: str          # INFO | WARN | ERROR
    container: str
    message: str


class LogsResponse(BaseModel):
    app_name: str
    resource_group: str
    total: int
    info_count: int
    warn_count: int
    error_count: int
    entries: list[LogEntry]
    has_more: bool


def _classify_level(message: str, level_col: str | None) -> str:
    """Determine log level from the raw level column or message content."""
    if level_col:
        lvl = level_col.strip().upper()
        if any(k in lvl for k in ("ERR", "EXCEPTION", "CRITICAL", "FATAL", "CRIT")):
            return "ERROR"
        if any(k in lvl for k in ("WARN", "WARNING")):
            return "WARN"
        return "INFO"
    # Fallback: scan the message text
    msg_upper = message.upper()
    if any(k in msg_upper for k in ("ERROR", "EXCEPTION", "FAILED", "CRITICAL", "FATAL")):
        return "ERROR"
    if any(k in msg_upper for k in ("WARN", "WARNING")):
        return "WARN"
    return "INFO"


@router.get("/{subscription_id}/{resource_group}/{app_name}", response_model=LogsResponse)
async def get_container_app_logs(
    subscription_id: str,
    resource_group: str,
    app_name: str,
    hours: int = Query(default=1, ge=1, le=168, description="Time window in hours (1-168)"),
    severity: Literal["all", "warn", "error"] = Query(default="all"),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    credential: TokenCredential = Depends(get_azure_credential),
):
    """
    Fetch logs for an Azure Container App from Log Analytics Workspace via ARM Proxy.
    This routes the query through management.azure.com so the Frontend's ARM token works natively without Audience mismatch!
    Requires Log Analytics Workspace to be linked to the Container App Environment.
    """
    try:
        # Get token from credential (which holds the Frontend's ARM token)
        token = credential.get_token("https://management.azure.com/.default").token
        
        # ── Build KQL query ──────────────────────────────────────────────────
        base_filter = f"ContainerAppName_s =~ '{app_name}'"

        if severity == "warn":
            base_filter += " and (Level_s =~ 'Warning' or Log_s contains 'WARN')"
        elif severity == "error":
            base_filter += " and (Level_s =~ 'Error' or Log_s contains 'ERROR' or Log_s contains 'Exception')"

        if search:
            safe_search = search.replace("'", "\\'")
            base_filter += f" and Log_s contains '{safe_search}'"

        kql = f"""
ContainerAppConsoleLogs_CL
| where {base_filter}
| project TimeGenerated, Level_s, ContainerName_s, Log_s
| order by TimeGenerated desc
| limit {limit + 1}
"""

        count_kql = f"""
ContainerAppConsoleLogs_CL
| where ContainerAppName_s =~ '{app_name}'
| summarize
    total    = count(),
    errors   = countif(Level_s =~ 'Error' or Log_s contains 'ERROR'),
    warnings = countif(Level_s =~ 'Warning' or Log_s contains 'WARN')
"""

        # We assume the LA workspace naturally uses the "-logs" suffix.
        workspace_name = f"{resource_group}-logs"
        url = (
            f"https://management.azure.com/subscriptions/{subscription_id}/resourcegroups/{resource_group}"
            f"/providers/Microsoft.OperationalInsights/workspaces/{workspace_name}/api/query?api-version=2020-08-01"
        )
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        def _execute_query(q: str):
            import urllib.request
            import urllib.error
            import json
            req = urllib.request.Request(url, headers=headers, data=json.dumps({"query": q}).encode('utf-8'))
            try:
                with urllib.request.urlopen(req) as response:
                    return json.loads(response.read().decode())
            except urllib.error.HTTPError as e:
                err_text = e.read().decode()
                # If table doesn't exist yet (e.g. brand new workspace/app), it throws SyntaxError
                if e.code == 400 and "SyntaxError" in err_text:
                    return {"Tables": []}
                # If workspace genuinely not found, 404
                if e.code == 404:
                    raise HTTPException(
                        status_code=404,
                        detail=(
                            "Log Analytics Workspace not found. "
                            "Please link a workspace to your Container App Environment in the Azure Portal: "
                            "Container Apps Environment → Monitoring → Log Analytics."
                        )
                    )
                raise Exception(f"Azure Monitor error [{e.code}]: {err_text}")

        # Run queries concurrently
        logs_result, counts_result = await asyncio.gather(
            asyncio.to_thread(_execute_query, kql),
            asyncio.to_thread(_execute_query, count_kql)
        )

        # ── Parse counts ─────────────────────────────────────────────────────
        total = warn_count = error_count = 0
        if counts_result and counts_result.get("Tables") and counts_result["Tables"][0].get("Rows"):
            row = counts_result["Tables"][0]["Rows"][0]
            if result_cols := counts_result["Tables"][0].get("Columns"):
                # Find indexes dynamically
                idx_total = next((i for i, c in enumerate(result_cols) if c["ColumnName"] == "total"), 0)
                idx_errs = next((i for i, c in enumerate(result_cols) if c["ColumnName"] == "errors"), 1)
                idx_warns = next((i for i, c in enumerate(result_cols) if c["ColumnName"] == "warnings"), 2)
                
                total = int(row[idx_total] if len(row) > idx_total and row[idx_total] is not None else 0)
                error_count = int(row[idx_errs] if len(row) > idx_errs and row[idx_errs] is not None else 0)
                warn_count = int(row[idx_warns] if len(row) > idx_warns and row[idx_warns] is not None else 0)

        info_count = max(0, total - warn_count - error_count)

        # ── Parse log entries ─────────────────────────────────────────────────
        entries: list[LogEntry] = []
        has_more = False
        
        if logs_result and logs_result.get("Tables") and logs_result["Tables"]:
            raw_rows = logs_result["Tables"][0].get("Rows", [])
            cols = logs_result["Tables"][0].get("Columns", [])
            
            idx_time = next((i for i, c in enumerate(cols) if c["ColumnName"] == "TimeGenerated"), 0)
            idx_level = next((i for i, c in enumerate(cols) if c["ColumnName"] == "Level_s"), 1)
            idx_container = next((i for i, c in enumerate(cols) if c["ColumnName"] == "ContainerName_s"), 2)
            idx_log = next((i for i, c in enumerate(cols) if c["ColumnName"] == "Log_s"), 3)

            has_more = len(raw_rows) > limit
            for row in raw_rows[:limit]:
                ts = str(row[idx_time]) if len(row) > idx_time and row[idx_time] is not None else ""
                level_col = str(row[idx_level]) if len(row) > idx_level and row[idx_level] is not None else ""
                container = str(row[idx_container]) if len(row) > idx_container and row[idx_container] is not None else app_name
                message = str(row[idx_log]) if len(row) > idx_log and row[idx_log] is not None else ""

                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    ts = dt.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
                except Exception:
                    pass

                entries.append(LogEntry(
                    timestamp=ts,
                    level=_classify_level(message, level_col),
                    container=container,
                    message=message,
                ))

        return LogsResponse(
            app_name=app_name,
            resource_group=resource_group,
            total=total,
            info_count=info_count,
            warn_count=warn_count,
            error_count=error_count,
            entries=entries,
            has_more=has_more,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error fetching logs for app '%s'", app_name)
        raise HTTPException(status_code=500, detail=str(e))
