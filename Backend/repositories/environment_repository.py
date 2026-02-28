from collections.abc import Sequence
from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.models import EnvironmentApp


class EnvironmentRepository:
    """Data access layer for environment applications."""

    def __init__(self, session: Session):
        self._session = session

    def create(self, environment: EnvironmentApp) -> EnvironmentApp:
        """Persist a new environment record."""
        self._session.add(environment)
        try:
            self._session.commit()
        except IntegrityError as exc:
            self._session.rollback()
            raise ValueError(f"Environment with name '{environment.name}' already exists.") from exc
        self._session.refresh(environment)
        return environment

    def get(self, env_id: int) -> Optional[EnvironmentApp]:
        """Fetch an environment by primary key."""
        return self._session.get(EnvironmentApp, env_id)

    def get_by_name(self, name: str) -> Optional[EnvironmentApp]:
        """Fetch an environment by unique name."""
        statement = select(EnvironmentApp).where(EnvironmentApp.name == name)
        return self._session.scalar(statement)

    def list(self, skip: int = 0, limit: int = 100) -> Sequence[EnvironmentApp]:
        """Return a paginated list of environments."""
        statement = (
            select(EnvironmentApp)
            .offset(max(skip, 0))
            .limit(limit if limit > 0 else 100)
            .order_by(EnvironmentApp.id)
        )
        return self._session.scalars(statement).all()

    def delete(self, environment: EnvironmentApp) -> None:
        """Remove an environment from the database."""
        self._session.delete(environment)
        self._session.commit()

