from fastapi import Depends
from sqlalchemy.orm import Session

from azure.core.credentials import TokenCredential
from core import Settings, get_settings, get_azure_credential
from db import get_db_session
from repositories import EnvironmentRepository
from services import AzureContainerAppService, EnvironmentService


def get_app_settings() -> Settings:
    return get_settings()


def get_environment_repository(session: Session = Depends(get_db_session)) -> EnvironmentRepository:
    return EnvironmentRepository(session)


def get_azure_service(
    settings: Settings = Depends(get_app_settings),
    credential: TokenCredential = Depends(get_azure_credential),
) -> AzureContainerAppService:
    return AzureContainerAppService(
        credential=credential,
        subscription_id=settings.azure_subscription_id or "",
    )


def get_environment_service(
    repository: EnvironmentRepository = Depends(get_environment_repository),
    azure_service: AzureContainerAppService = Depends(get_azure_service),
) -> EnvironmentService:
    return EnvironmentService(repository=repository, azure_service=azure_service)

 
 