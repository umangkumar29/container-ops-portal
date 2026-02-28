from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import api_router
from core import get_settings
from db import Base, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    # In production prefer migrations (Alembic), but this keeps local dev simple.
    Base.metadata.create_all(bind=engine, checkfirst=True)
    yield


def create_application() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.project_name,
        lifespan=lifespan,
        docs_url=settings.docs_url,
        openapi_url=settings.openapi_url,
        redoc_url=settings.redoc_url,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )

    application.include_router(api_router, prefix="/api/v1")

    @application.get("/", tags=["Health"])
    async def healthcheck():
        return {"message": "System operational"}

    return application


app = create_application()
