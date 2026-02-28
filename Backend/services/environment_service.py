import asyncio
from collections.abc import Sequence
from typing import Optional

from db.models import EnvironmentApp
from repositories import EnvironmentRepository
from schemas import ContainerStatus, EnvironmentCreate
from services.azure_service import AzureContainerAppService


class EnvironmentService:
    """Business logic for managing environment definitions and Azure operations."""

    def __init__(
        self,
        repository: EnvironmentRepository,
        azure_service: AzureContainerAppService,
    ) -> None:
        self._repository = repository
        self._azure_service = azure_service

    def create_environment(self, payload: EnvironmentCreate) -> EnvironmentApp:
        existing = self._repository.get_by_details(
            resource_group=payload.resource_group,
            frontend_app=payload.frontend_app_name,
            backend_app=payload.backend_app_name
        )
        if existing:
            raise ValueError(f"An environment containing these apps already exists (Name: {existing.name}).")
            
        environment = EnvironmentApp(**payload.model_dump())
        return self._repository.create(environment)

    def list_environments(self, skip: int = 0, limit: int = 100) -> Sequence[EnvironmentApp]:
        return self._repository.list(skip=skip, limit=limit)

    def get_environment(self, env_id: int) -> Optional[EnvironmentApp]:
        return self._repository.get(env_id)

    def delete_environment(self, env_id: int) -> None:
        environment = self._repository.get(env_id)
        if environment is None:
            raise ValueError("Environment not found.")
        self._repository.delete(environment)

    async def get_environment_status(self, environment: EnvironmentApp) -> ContainerStatus:
        frontend_status, backend_status = await asyncio.gather(
            self._azure_service.get_app_status(environment.resource_group, environment.frontend_app_name),
            self._azure_service.get_app_status(environment.resource_group, environment.backend_app_name),
        )
        return ContainerStatus(frontend_status=frontend_status, backend_status=backend_status)

    async def restart_environment(self, environment: EnvironmentApp) -> bool:
        results = await asyncio.gather(
            self._azure_service.restart_app(environment.resource_group, environment.frontend_app_name),
            self._azure_service.restart_app(environment.resource_group, environment.backend_app_name),
        )
        return all(results)

    async def stop_environment(self, environment: EnvironmentApp) -> bool:
        results = await asyncio.gather(
            self._azure_service.stop_app(environment.resource_group, environment.frontend_app_name),
            self._azure_service.stop_app(environment.resource_group, environment.backend_app_name),
        )
        return all(results)

    async def start_environment(self, environment: EnvironmentApp) -> bool:
        results = await asyncio.gather(
            self._azure_service.start_app(environment.resource_group, environment.frontend_app_name),
            self._azure_service.start_app(environment.resource_group, environment.backend_app_name),
        )
        return all(results)
