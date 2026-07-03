from uuid import uuid4
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-Id") or str(uuid4())
        response = await call_next(request)
        response.headers["X-Request-Id"] = request_id
        return response
