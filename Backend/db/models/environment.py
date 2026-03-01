import datetime
from sqlalchemy import Boolean, Column, Integer, String, DateTime

from db.base import Base


class EnvironmentApp(Base):
    """Database representation of an environment application mapping."""

    __tablename__ = "environment_apps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    resource_group = Column(String(255), nullable=False)
    frontend_app_name = Column(String(255), nullable=False)
    backend_app_name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False, server_default="DEV")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))

