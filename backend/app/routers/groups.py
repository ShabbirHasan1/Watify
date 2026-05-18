"""Friend Groups CRUD endpoints under /api/groups.

Hard 20-contact cap enforced here; surfaced to clients as HTTP 409 with
body `{"error": "group_full", "max": 20}` so the frontend can disable
its Add Contact UI deterministically.
"""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, func, select

from app.constants import MAX_CONTACTS_PER_GROUP
from app.db import get_session
from app.jid import InvalidPhoneError, normalize_phone
from app.models import Contact, FriendGroup, JobStatus, SendJob
from app.scheduler import aps_job_id, get_scheduler
from app.schemas import (
    BulkContactsRequest,
    BulkContactsResponse,
    BulkRejectedReason,
    ContactCreate,
    ContactRead,
    FriendGroupCreate,
    FriendGroupDetail,
    FriendGroupRead,
    FriendGroupUpdate,
)

router = APIRouter(prefix="/api/groups", tags=["groups"])


def _get_group_or_404(session: Session, group_id: int) -> FriendGroup:
    grp = session.get(FriendGroup, group_id)
    if grp is None:
        raise HTTPException(status_code=404, detail="group_not_found")
    return grp


def _contact_count(session: Session, group_id: int) -> int:
    stmt = select(func.count()).select_from(Contact).where(Contact.group_id == group_id)
    return int(session.exec(stmt).one())


@router.post("", response_model=FriendGroupRead, status_code=status.HTTP_201_CREATED)
def create_group(
    body: FriendGroupCreate,
    session: Session = Depends(get_session),
) -> FriendGroupRead:
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="name_blank")
    if session.exec(select(FriendGroup).where(FriendGroup.name == name)).first():
        raise HTTPException(status_code=409, detail="group_name_taken")
    grp = FriendGroup(name=name)
    session.add(grp)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="group_name_taken")
    session.refresh(grp)
    return FriendGroupRead(
        id=grp.id,
        name=grp.name,
        created_at=grp.created_at,
        contact_count=0,
    )


@router.get("", response_model=list[FriendGroupRead])
def list_groups(session: Session = Depends(get_session)) -> list[FriendGroupRead]:
    groups = session.exec(select(FriendGroup).order_by(FriendGroup.created_at)).all()
    return [
        FriendGroupRead(
            id=g.id,
            name=g.name,
            created_at=g.created_at,
            contact_count=_contact_count(session, g.id),
        )
        for g in groups
    ]


@router.get("/{group_id}", response_model=FriendGroupDetail)
def get_group(
    group_id: int,
    session: Session = Depends(get_session),
) -> FriendGroupDetail:
    grp = _get_group_or_404(session, group_id)
    contacts = session.exec(
        select(Contact).where(Contact.group_id == group_id).order_by(Contact.created_at)
    ).all()
    return FriendGroupDetail(
        id=grp.id,
        name=grp.name,
        created_at=grp.created_at,
        contacts=[
            ContactRead(
                id=c.id,
                group_id=c.group_id,
                name=c.name,
                phone_e164=c.phone_e164,
                created_at=c.created_at,
            )
            for c in contacts
        ],
    )


@router.patch("/{group_id}", response_model=FriendGroupRead)
def update_group(
    group_id: int,
    body: FriendGroupUpdate,
    session: Session = Depends(get_session),
) -> FriendGroupRead:
    grp = _get_group_or_404(session, group_id)
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="name_blank")
    grp.name = name
    try:
        session.add(grp)
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="group_name_taken")
    session.refresh(grp)
    return FriendGroupRead(
        id=grp.id,
        name=grp.name,
        created_at=grp.created_at,
        contact_count=_contact_count(session, grp.id),
    )


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: int,
    session: Session = Depends(get_session),
) -> Response:
    grp = _get_group_or_404(session, group_id)

    # Cancel any APScheduler entries before the cascade wipes the SendJob rows.
    # APScheduler has its own table with no FK to send_job, so it would not be
    # cleaned up by SQLAlchemy's cascade.
    pending_jobs = session.exec(
        select(SendJob.id).where(
            SendJob.group_id == group_id,
            SendJob.status.in_([JobStatus.pending, JobStatus.scheduled]),
        )
    ).all()
    scheduler = get_scheduler()
    for job_id in pending_jobs:
        try:
            scheduler.remove_job(aps_job_id(job_id))
        except Exception:  # noqa: BLE001 — job may have already fired
            pass

    session.delete(grp)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{group_id}/contacts",
    response_model=ContactRead,
    status_code=status.HTTP_201_CREATED,
)
def add_contact(
    group_id: int,
    body: ContactCreate,
    session: Session = Depends(get_session),
) -> ContactRead:
    _get_group_or_404(session, group_id)
    count = _contact_count(session, group_id)
    if count >= MAX_CONTACTS_PER_GROUP:
        raise HTTPException(
            status_code=409,
            detail={"error": "group_full", "max": MAX_CONTACTS_PER_GROUP},
        )
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="name_blank")
    try:
        phone = normalize_phone(body.phone)
    except InvalidPhoneError as e:
        raise HTTPException(status_code=422, detail=str(e))
    contact = Contact(group_id=group_id, name=name, phone_e164=phone)
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return ContactRead(
        id=contact.id,
        group_id=contact.group_id,
        name=contact.name,
        phone_e164=contact.phone_e164,
        created_at=contact.created_at,
    )


@router.post(
    "/{group_id}/contacts/bulk",
    response_model=BulkContactsResponse,
    status_code=status.HTTP_201_CREATED,
)
def bulk_add_contacts(
    group_id: int,
    body: BulkContactsRequest,
    session: Session = Depends(get_session),
) -> BulkContactsResponse:
    _get_group_or_404(session, group_id)

    rejected: list[BulkRejectedReason] = []
    normalized: list[tuple[int, str, str]] = []
    for i, row in enumerate(body.contacts):
        name = row.name.strip()
        if not name:
            rejected.append(BulkRejectedReason(index=i, reason="name_blank"))
            continue
        try:
            phone = normalize_phone(row.phone)
        except InvalidPhoneError as e:
            rejected.append(BulkRejectedReason(index=i, reason=str(e)))
            continue
        normalized.append((i, name, phone))

    if rejected:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "bulk_rejected",
                "reasons": [r.model_dump() for r in rejected],
            },
        )

    existing_phones = {
        c.phone_e164
        for c in session.exec(
            select(Contact).where(Contact.group_id == group_id)
        ).all()
    }

    to_insert: list[tuple[int, str, str]] = []
    duplicates: list[tuple[int, str, str]] = []
    seen_in_batch: set[str] = set()
    for i, name, phone in normalized:
        if phone in existing_phones or phone in seen_in_batch:
            duplicates.append((i, name, phone))
            continue
        seen_in_batch.add(phone)
        to_insert.append((i, name, phone))

    existing_count = _contact_count(session, group_id)
    if existing_count + len(to_insert) > MAX_CONTACTS_PER_GROUP:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "group_full",
                "max": MAX_CONTACTS_PER_GROUP,
                "current": existing_count,
                "would_add": len(to_insert),
            },
        )

    inserted_models = [
        Contact(group_id=group_id, name=name, phone_e164=phone)
        for _, name, phone in to_insert
    ]
    session.add_all(inserted_models)
    session.commit()
    for c in inserted_models:
        session.refresh(c)

    inserted = [
        ContactRead(
            id=c.id,
            group_id=c.group_id,
            name=c.name,
            phone_e164=c.phone_e164,
            created_at=c.created_at,
        )
        for c in inserted_models
    ]

    skipped: list[ContactRead] = []
    for _, name, phone in duplicates:
        existing = session.exec(
            select(Contact).where(
                Contact.group_id == group_id, Contact.phone_e164 == phone
            )
        ).first()
        if existing is not None:
            skipped.append(
                ContactRead(
                    id=existing.id,
                    group_id=existing.group_id,
                    name=existing.name,
                    phone_e164=existing.phone_e164,
                    created_at=existing.created_at,
                )
            )

    return BulkContactsResponse(inserted=inserted, skipped=skipped)


@router.delete(
    "/{group_id}/contacts/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_contact(
    group_id: int,
    contact_id: int,
    session: Session = Depends(get_session),
) -> Response:
    _get_group_or_404(session, group_id)
    contact = session.get(Contact, contact_id)
    if contact is None or contact.group_id != group_id:
        raise HTTPException(status_code=404, detail="contact_not_found")
    session.delete(contact)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
