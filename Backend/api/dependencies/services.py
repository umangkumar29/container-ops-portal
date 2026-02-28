from fastapi import Depends
from sqlalchemy.orm import Session

from core import Settings, get_settings
from db import get_db_session
from repositories import EnvironmentRepository
from services import AzureContainerAppService, EnvironmentService


def get_app_settings() -> Settings:
    return get_settings()


def get_environment_repository(session: Session = Depends(get_db_session)) -> EnvironmentRepository:
    return EnvironmentRepository(session)


def get_azure_service(settings: Settings = Depends(get_app_settings)) -> AzureContainerAppService:
    return AzureContainerAppService(settings=settings)


def get_environment_service(
    repository: EnvironmentRepository = Depends(get_environment_repository),
    azure_service: AzureContainerAppService = Depends(get_azure_service),
) -> EnvironmentService:
    return EnvironmentService(repository=repository, azure_service=azure_service)

