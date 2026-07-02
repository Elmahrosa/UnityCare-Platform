import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60, redis_url: str | None = None):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.redis_url = redis_url
        self._redis = None
        self._redis_available = None
        self.requests = defaultdict(list)

    async def _get_redis(self):
        if self._redis_available is None and self.redis_url:
            try:
                import redis.asyncio as aioredis
                self._redis = await aioredis.from_url(self.redis_url, decode_responses=True)
                await self._redis.ping()
                self._redis_available = True
            except Exception:
                self._redis_available = False
        return self._redis if self._redis_available else None

    def _prune(self):
        now = time.time()
        cutoff = now - self.window_seconds
        to_delete = [k for k, v in self.requests.items() if not v or max(v) < cutoff]
        for k in to_delete:
            del self.requests[k]

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        if path.startswith("/health"):
            return await call_next(request)
        key = f"rl:{client_ip}:{path}"
        now = time.time()

        redis_client = await self._get_redis()
        if redis_client:
            window = int(now // self.window_seconds)
            redis_key = f"{key}:{window}"
            count = await redis_client.incr(redis_key)
            if count == 1:
                await redis_client.expire(redis_key, self.window_seconds + 1)
            if count > self.max_requests:
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")
        else:
            self._prune()
            timestamps = self.requests[key]
            timestamps[:] = [t for t in timestamps if now - t < self.window_seconds]
            if len(timestamps) >= self.max_requests:
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")
            timestamps.append(now)

        return await call_next(request)
