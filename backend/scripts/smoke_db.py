"""Smoke test: insert a FriendGroup with one Contact, read them back.

Run from the backend/ directory: `uv run python scripts/smoke_db.py`.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session, select  # noqa: E402

from app.db import engine, init_db  # noqa: E402
from app.models import Contact, FriendGroup  # noqa: E402
from scripts._fixtures import TEST_PHONE_E164_DIGITS  # noqa: E402


def main() -> int:
    init_db()
    with Session(engine) as s:
        existing = s.exec(select(FriendGroup).where(FriendGroup.name == "smoke")).first()
        if existing is None:
            grp = FriendGroup(name="smoke")
            s.add(grp)
            s.commit()
            s.refresh(grp)
        else:
            grp = existing

        if not s.exec(select(Contact).where(Contact.group_id == grp.id)).first():
            c = Contact(group_id=grp.id, name="self", phone_e164=TEST_PHONE_E164_DIGITS)
            s.add(c)
            s.commit()

        groups = s.exec(select(FriendGroup)).all()
        for g in groups:
            contacts = s.exec(select(Contact).where(Contact.group_id == g.id)).all()
            print(f"group={g.name!r} id={g.id} contacts={len(contacts)}")
            for c in contacts:
                print(f"  contact id={c.id} name={c.name!r} phone={c.phone_e164}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
