"""Phone number normalization aligned with wars JID rules.

wars accepts E.164 forms like '919876543210', '+91 98765 43210', or full
JIDs. For storage and equality we normalize everything to a digits-only
string. This module is also the one place that decides what counts as a
valid recipient phone.
"""

import re

_NON_DIGIT_RE = re.compile(r"\D")

MIN_DIGITS = 6
MAX_DIGITS = 15  # E.164 max


class InvalidPhoneError(ValueError):
    """Raised when a phone string cannot be normalized to a valid E.164 digit run."""


def normalize_phone(raw: str) -> str:
    """Return digits-only phone, validated for length.

    Strips '+', spaces, dashes, parens, and any other non-digit chars.
    Raises InvalidPhoneError if the result is not 6-15 digits.
    """
    if raw is None:
        raise InvalidPhoneError("phone is required")
    digits = _NON_DIGIT_RE.sub("", str(raw))
    n = len(digits)
    if n < MIN_DIGITS or n > MAX_DIGITS:
        raise InvalidPhoneError(
            f"phone must be {MIN_DIGITS}-{MAX_DIGITS} digits after normalization (got {n})"
        )
    return digits


def redact_phone(phone: str) -> str:
    """Render a phone for logs without exposing the full number."""
    if not phone:
        return "<empty>"
    digits = _NON_DIGIT_RE.sub("", phone)
    if len(digits) <= 4:
        return "X" * len(digits)
    return f"{digits[:2]}{'X' * (len(digits) - 6)}{digits[-4:]}"
