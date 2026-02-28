from fastapi import APIRouter, Depends, HTTPException, Response, status

from api.dependencies import get_environment_service
from schemas import ContainerStatus, EnvironmentCreate, EnvironmentRead
from services import EnvironmentService

router = APIRouter(prefix="/environments", tags=["Environments"])


@router.post(
    "/",
    response_model=EnvironmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_environment(
    payload: EnvironmentCreate,
    service: EnvironmentService = Depends(get_environment_service),
) -> EnvironmentRead:
    try:
        environment = service.create_environment(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return EnvironmentRead.model_validate(environment)


@router.get(
    "/",
    response_model=list[EnvironmentRead],
)
def list_environments(
    skip: int = 0,
    limit: int = 100,
    service: EnvironmentService = Depends(get_environment_service),
) -> list[EnvironmentRead]:
    environments = service.list_environments(skip=skip, limit=limit)
    return [EnvironmentRead.model_validate(env) for env in environments]


@router.delete(
    "/{env_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_environment(
    env_id: int,
    service: EnvironmentService = Depends(get_environment_service),
) -> Response:
    try:
        service.delete_environment(env_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{env_id}/status",
    response_model=ContainerStatus,
)
async def get_environment_status(
    env_id: int,
    service: EnvironmentService = Depends(get_environment_service),
) -> ContainerStatus:
    environment = service.get_environment(env_id)
    if environment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Environment not found.")
    return await service.get_environment_status(environment)


@router.post(
    "/{env_id}/restart",
    status_code=status.HTTP_202_ACCEPTED,
)
async def restart_environment(
    env_id: int,
    service: EnvironmentService = Depends(get_environment_service),
) -> dict[str, str]:
    environment = service.get_environment(env_id)
    if environment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Environment not found.")

    success = await service.restart_environment(environment)
    if not success:
        return {"status": "Partial/Failed restart. Check logs."}

    return {"status": "Restart initiated successfully"}

@router.post(
    "/{env_id}/stop",
    status_code=status.HTTP_202_ACCEPTED,
)
async def stop_environment(
    env_id: int,
    service: EnvironmentService = Depends(get_environment_service),
) -> dict[str, str]:
    environment = service.get_environment(env_id)
    if environment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Environment not found.")

    success = await service.stop_environment(environment)
    if not success:
        return {"status": "Partial/Failed stop. Check logs."}

    return {"status": "Stop initiated successfully"}

@router.post(
    "/{env_id}/start",
    status_code=status.HTTP_202_ACCEPTED,
)
async def start_environment(
    env_id: int,
    service: EnvironmentService = Depends(get_environment_service),
) -> dict[str, str]:
    environment = service.get_environment(env_id)
    if environment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Environment not found.")

    success = await service.start_environment(environment)
    if not success:
        return {"status": "Partial/Failed start. Check logs."}

    return {"status": "Start initiated successfully"}

