from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import time


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        if path.startswith("/health"):
            return await call_next(request)
        key = f"{client_ip}:{path}"
        now = time.time()
        if key in self.requests:
            self.requests[key] = [t for t in self.requests[key] if now - t < self.window_seconds]
            if len(self.requests[key]) >= self.max_requests:
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")
            self.requests[key].append(now)
        else:
            self.requests[key] = [now]
        return await call_next(request)
