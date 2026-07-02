import logging
from contextlib import asynccontextmanager
import sqlalchemy
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import init_db, engine
from app.api.v1 import auth_router, patients_router, consents_router, audit_router, admin_router, medical_router
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware

logger = logging.getLogger("unitycare")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
    except Exception as e:
        logger.warning("Database init skipped: %s", e)
    try:
        if settings.otel_exporter_otlp_endpoint:
            from opentelemetry import trace
            from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
            from opentelemetry.sdk.trace import TracerProvider
            from opentelemetry.sdk.trace.export import BatchSpanProcessor
            provider = TracerProvider()
            processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=settings.otel_exporter_otlp_endpoint))
            provider.add_span_processor(processor)
            trace.set_tracer_provider(provider)
    except Exception as e:
        logger.warning("OpenTelemetry init skipped: %s", e)
    yield


app = FastAPI(
    title="UnityCare — Healthcare Trust Infrastructure",
    description="Healthcare Identity, Consent, and Interoperability Platform — by Elmahrosa International",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)
app.add_middleware(RateLimitMiddleware, max_requests=settings.rate_limit_per_minute, redis_url=settings.redis_url)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(patients_router, prefix="/api/v1")
app.include_router(consents_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(medical_router, prefix="/api/v1")


@app.get("/health")
async def health():
    db_ok = False
    try:
        async with engine.connect() as conn:
            await conn.execute(sqlalchemy.text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "app": "UnityCare MVP",
    }


@app.get("/status")
async def status():
    db_ok = False
    try:
        async with engine.connect() as conn:
            await conn.execute(sqlalchemy.text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False
    return {
        "app": settings.app_name,
        "version": "1.0.0",
        "environment": settings.environment,
        "database": "connected" if db_ok else "disconnected",
    }


@app.get("/version")
async def version():
    return {
        "app": settings.app_name,
        "version": "1.0.0",
        "framework": "FastAPI",
        "python": "3.12",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


try:
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    FastAPIInstrumentor.instrument_app(app)
except Exception as e:
    logger.warning("OpenTelemetry instrumentation skipped: %s", e)
