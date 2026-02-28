from pydantic import BaseModel, Field


class EnvironmentBase(BaseModel):
    name: str = Field(..., example="KPIT GM QA")
    resource_group: str = Field(..., example="rg-kpit-qa")
    frontend_app_name: str = Field(..., example="frontend-container-app")
    backend_app_name: str = Field(..., example="backend-container-app")
    is_active: bool = True


class EnvironmentCreate(EnvironmentBase):
    """Schema for creating an environment entry."""

    pass


class EnvironmentRead(EnvironmentBase):
    """Schema returned from the API."""

    id: int

    class Config:
        from_attributes = True


class ContainerStatus(BaseModel):
    frontend_status: str
    backend_status: str

