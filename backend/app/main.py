import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import init_db
from app.api.v1 import auth_router, patients_router, consents_router, audit_router, admin_router
from app.middleware.rate_limit import RateLimitMiddleware

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
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware, max_requests=settings.rate_limit_per_minute)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(patients_router, prefix="/api/v1")
app.include_router(consents_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0", "app": "UnityCare MVP"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


try:
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    FastAPIInstrumentor.instrument_app(app)
except Exception as e:
    logger.warning("OpenTelemetry instrumentation skipped: %s", e)
