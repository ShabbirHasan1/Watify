"""Request and response schemas. Kept separate from SQLModel table classes
so the wire shapes can evolve independently of the ORM.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class FriendGroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class FriendGroupUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=1, max_length=40)


class ContactRead(BaseModel):
    id: int
    group_id: int
    name: str
    phone_e164: str
    created_at: datetime


class FriendGroupRead(BaseModel):
    id: int
    name: str
    created_at: datetime
    contact_count: int


class FriendGroupDetail(BaseModel):
    id: int
    name: str
    created_at: datetime
    contacts: list[ContactRead]


class ApiError(BaseModel):
    error: str
    detail: str | None = None
    max: int | None = None
