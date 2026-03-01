from fastapi import APIRouter

from api.v1.endpoints import environments, azure_discovery, cost

api_router = APIRouter()
api_router.include_router(environments.router)
api_router.include_router(azure_discovery.router)
api_router.include_router(cost.router)

