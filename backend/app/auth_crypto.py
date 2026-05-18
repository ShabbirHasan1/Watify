"""Password hashing + refresh-secret helpers (TKT-0023).

argon2id via argon2-cffi. Defaults are the argon2-cffi PasswordHasher
defaults (time_cost=3, memory_cost=64 MiB, parallelism=4) which are
generous for a single-user box -- a login attempt is ~10-50 ms on
modern hardware and well-suited to slow down brute force.
"""

from __future__ import annotations

import secrets

from argon2 import PasswordHasher
from argon2.exceptions import (
    InvalidHashError,
    VerificationError,
    VerifyMismatchError,
)

_hasher = PasswordHasher()


class AuthCryptoError(RuntimeError):
    """Raised on malformed hash strings or argon2 internal errors.
    Distinct from `VerifyMismatchError` (wrong password) so callers can
    treat "this user just typed the wrong password" differently from
    "the stored hash is corrupted, fail loudly"."""


def hash_password(plain: str) -> str:
    """Return an argon2id hash string. Never log or persist the input."""
    if not plain:
        raise AuthCryptoError("password is required")
    return _hasher.hash(plain)


def verify_password(plain: str, stored_hash: str) -> bool:
    """Return True iff `plain` hashes to `stored_hash`. Returns False on
    a clean mismatch. Raises AuthCryptoError on corrupted hash strings
    (operator should re-register).
    """
    if not plain or not stored_hash:
        return False
    try:
        _hasher.verify(stored_hash, plain)
        return True
    except VerifyMismatchError:
        return False
    except (InvalidHashError, VerificationError) as e:
        raise AuthCryptoError("stored password hash is corrupted") from e


def needs_rehash(stored_hash: str) -> bool:
    """Returns True if the stored hash uses old argon2 parameters
    and should be re-hashed on the next successful login. The caller
    is expected to update the User row when this is True."""
    try:
        return _hasher.check_needs_rehash(stored_hash)
    except InvalidHashError:
        return False


def generate_refresh_secret() -> str:
    """32 random bytes -> url-safe base64. Used as the per-user JWT
    refresh-token signing key; rotated on logout so any stolen
    refresh token is invalidated."""
    return secrets.token_urlsafe(32)
