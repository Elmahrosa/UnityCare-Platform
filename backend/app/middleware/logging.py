import logging
import json
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class JSONLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000)
        log_entry = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": "INFO",
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
            "request_id": response.headers.get("X-Request-Id", ""),
        }
        logger = logging.getLogger("unitycare")
        logger.info(json.dumps(log_entry))
        return response
