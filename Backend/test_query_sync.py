import sys
from azure.identity import AzureCliCredential
from azure.monitor.query import LogsQueryClient
from datetime import timedelta

def test():
    cred = AzureCliCredential()
    client = LogsQueryClient(cred)
    sub = "e4d1d43a-981e-40f4-a8ea-879bca2af86f"
    rg = "mechinstruction-resources"
    try:
        res = client.query_resource(
            f"/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/containerApps/test-backend-app",
            query="ContainerAppConsoleLogs_CL | take 1",
            timespan=timedelta(days=1)
        )
        print("query_resource SUCCESS:", len(res.tables))
    except Exception as e:
        print("query_resource FAILED:", e)

if __name__ == "__main__":
    test()
