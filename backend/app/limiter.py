"""TKT-0015: slowapi limiter singleton + 429 handler.

Keyed by remote IP (`get_remote_address`). For a single-user local app
that maps to "this operator's machine", which is the right scope --
loops from one operator should not be able to bypass by changing port
or path. Production deployments behind a proxy should set
`headers_enabled=True` and trust `X-Forwarded-For` via uvicorn's
`--proxy-headers`.

The 429 handler returns the flat error envelope agreed in TKT-0001:
`{"error": "rate_limited", "detail": "...", "retry_after": N}`.
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)


async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Custom 429 body matching TKT-0001's flat envelope."""
    # slowapi puts `detail` like "5 per 1 minute". Surface a stable
    # `retry_after` (seconds) the UI can use to back off cleanly.
    detail = str(exc.detail) if exc.detail else "rate limit exceeded"
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limited",
            "detail": detail,
            "retry_after": 60,
        },
        headers={"Retry-After": "60"},
    )
