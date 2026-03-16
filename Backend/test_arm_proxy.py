import urllib.request
import urllib.error
import urllib.parse
import json
from azure.identity import AzureCliCredential

def test():
    cred = AzureCliCredential()
    token = cred.get_token("https://management.azure.com/.default").token
    sub = "e4d1d43a-981e-40f4-a8ea-879bca2af86f"
    rg = "mechinstruction-resources"
    ws = "mechinstruction-resources-logs"
    url = f"https://management.azure.com/subscriptions/{sub}/resourcegroups/{rg}/providers/Microsoft.OperationalInsights/workspaces/{ws}/api/query?api-version=2022-10-27"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    body = {
        "query": "ContainerAppConsoleLogs_CL | take 1"
    }
    
    req = urllib.request.Request(url, headers=headers, data=json.dumps(body).encode('utf-8'))
    try:
        with urllib.request.urlopen(req) as response:
            print("STATUS:", response.status)
            print("BODY:", response.read().decode())
    except urllib.error.HTTPError as e:
        print("STATUS:", e.code)
        print("BODY:", e.read().decode())

if __name__ == "__main__":
    test()
