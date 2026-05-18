"""Shared test fixtures for backend smokes (TKT-0006).

This module exists so the security-audit phone-grep can allow-list a
single import path instead of chasing inline `9NNNNNNNNNN` strings
scattered across smoke scripts. Nothing in `backend/app` imports from
here -- the runtime path never sees these constants.

Add new fixtures here when a new smoke wants a canonical fake.
"""

from __future__ import annotations

# Fake Indian number in E.164 normalized form. Not a real subscriber.
# wars/normalize_phone strips the `+`; the digits-only derivative below
# matches what ends up in the `contact.phone_e164` column.
TEST_PHONE_E164: str = "+911234567890"
TEST_PHONE_E164_DIGITS: str = "911234567890"
