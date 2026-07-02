import uuid
from datetime import datetime, timezone
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.audit import AuditEvent
from app.services.audit import AuditService


class TestAuditService:
    async def test_log_event_creates_entry(self, db_session: AsyncSession):
        audit = AuditService(db_session)
        event = await audit.log_event(
            action="test.action",
            resource_type="test",
            actor_id=uuid.uuid4(),
        )
        assert event.id is not None
        assert event.action == "test.action"
        assert event.event_hash is not None
        assert event.previous_hash is None

    async def test_get_events_with_filters(self, db_session: AsyncSession):
        audit = AuditService(db_session)
        actor = uuid.uuid4()
        await audit.log_event("user.login", "user", actor_id=actor, actor_email="a@b.com")
        await audit.log_event("user.logout", "user", actor_id=actor, actor_email="a@b.com")
        await audit.log_event("patient.created", "patient", actor_id=uuid.uuid4())

        events, total = await audit.get_events(action="user.login")
        assert total == 1
        assert len(events) == 1
        assert events[0].action == "user.login"

        events2, total2 = await audit.get_events(resource_type="user")
        assert total2 == 2
        assert len(events2) == 2

    async def test_verify_chain_valid(self, db_session: AsyncSession):
        audit = AuditService(db_session)
        await audit.log_event("event.1", "test")
        await audit.log_event("event.2", "test")
        await audit.log_event("event.3", "test")
        assert await audit.verify_chain() is True

    async def test_chain_tampered_returns_false(self, db_session: AsyncSession):
        audit = AuditService(db_session)
        await audit.log_event("event.1", "test")
        await audit.log_event("event.2", "test")

        tampered = await db_session.execute(select(AuditEvent).order_by(AuditEvent.id).limit(1))
        event = tampered.scalar_one()
        event.event_hash = "tampered-hash-value"
        await db_session.flush()

        assert await audit.verify_chain() is False

    async def test_audit_events_paginated(self, db_session: AsyncSession):
        audit = AuditService(db_session)
        for i in range(5):
            await audit.log_event(f"event.{i}", "test")
        page1, total1 = await audit.get_events(skip=0, limit=2)
        assert len(page1) == 2
        assert total1 == 5
        page2, total2 = await audit.get_events(skip=2, limit=2)
        assert len(page2) == 2
        assert total2 == 5
