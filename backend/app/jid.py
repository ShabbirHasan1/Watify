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


# TKT-0017: explicit JID helpers so callers don't hand-stitch
# `<digits>@s.whatsapp.net` everywhere. wars uses these JIDs internally
# for 1:1 chats; group JIDs end in `@g.us` and are not supported by
# Watify (single-user, friends-list app).

JID_SUFFIX = "@s.whatsapp.net"


def phone_to_jid(phone: str) -> str:
    """Normalize a phone to digits and append the WhatsApp 1:1 JID suffix.

    Raises InvalidPhoneError if the input cannot be normalized.
    """
    return f"{normalize_phone(phone)}{JID_SUFFIX}"


def jid_to_phone(jid: str) -> str:
    """Extract the bare-digits phone from a WhatsApp 1:1 JID.

    Tolerates the optional `:NN` device-suffix wars sometimes carries on
    the sender field. Raises InvalidPhoneError when the JID is malformed
    or carries a non-1:1 suffix (e.g. group `@g.us`).
    """
    if not jid or not isinstance(jid, str):
        raise InvalidPhoneError("jid is required")
    if JID_SUFFIX not in jid:
        raise InvalidPhoneError(
            f"jid must end in {JID_SUFFIX} (got {jid!r})"
        )
    local = jid.split(JID_SUFFIX, 1)[0]
    # Strip optional `:device` suffix.
    local = local.split(":", 1)[0]
    return normalize_phone(local)
