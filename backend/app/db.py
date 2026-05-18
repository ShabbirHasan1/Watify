from collections.abc import Generator
from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

DB_PATH = Path(__file__).resolve().parent.parent / "app.db"
DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    from app import models  # noqa: F401 — ensure models are registered

    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
