from datetime import datetime, timezone
from enum import Enum

from sqlmodel import Field, Relationship, SQLModel


def _now() -> datetime:
    return datetime.now(timezone.utc)


class JobStatus(str, Enum):
    pending = "pending"
    scheduled = "scheduled"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class AttemptStatus(str, Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"


class FriendGroup(SQLModel, table=True):
    __tablename__ = "friend_group"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, min_length=1, max_length=80)
    created_at: datetime = Field(default_factory=_now)

    contacts: list["Contact"] = Relationship(
        back_populates="group",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    jobs: list["SendJob"] = Relationship(back_populates="group")


class Contact(SQLModel, table=True):
    __tablename__ = "contact"

    id: int | None = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="friend_group.id", index=True)
    name: str = Field(min_length=1, max_length=80)
    phone_e164: str = Field(min_length=6, max_length=20, index=True)
    created_at: datetime = Field(default_factory=_now)

    group: FriendGroup | None = Relationship(back_populates="contacts")


class SendJob(SQLModel, table=True):
    __tablename__ = "send_job"

    id: int | None = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="friend_group.id", index=True)
    message: str = Field(min_length=1, max_length=4096)
    status: JobStatus = Field(default=JobStatus.pending, index=True)
    scheduled_at: datetime | None = Field(default=None, index=True)
    started_at: datetime | None = None
    finished_at: datetime | None = None
    min_delay_s: int = Field(default=3, ge=1, le=300)
    max_delay_s: int = Field(default=30, ge=1, le=300)
    created_at: datetime = Field(default_factory=_now)

    group: FriendGroup | None = Relationship(back_populates="jobs")
    attempts: list["SendAttempt"] = Relationship(
        back_populates="job",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class SendAttempt(SQLModel, table=True):
    __tablename__ = "send_attempt"

    id: int | None = Field(default=None, primary_key=True)
    job_id: int = Field(foreign_key="send_job.id", index=True)
    contact_id: int = Field(foreign_key="contact.id", index=True)
    status: AttemptStatus = Field(default=AttemptStatus.pending, index=True)
    sent_at: datetime | None = None
    error: str | None = Field(default=None, max_length=512)

    job: SendJob | None = Relationship(back_populates="attempts")
