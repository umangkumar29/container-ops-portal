from fastapi import APIRouter

from api.v1.endpoints import environments

api_router = APIRouter()
api_router.include_router(environments.router)

