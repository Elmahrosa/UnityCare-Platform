import uuid
from datetime import datetime, timezone
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditEvent
from app.utils.hashing import compute_event_hash


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_event(
        self,
        action: str,
        resource_type: str,
        actor_id: uuid.UUID | None = None,
        actor_email: str | None = None,
        resource_id: str | None = None,
        details: dict | None = None,
        ip_address: str | None = None,
    ) -> AuditEvent:
        last_hash = await self._get_last_hash()
        event_data = {
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "actor_id": str(actor_id) if actor_id else None,
            "actor_email": actor_email,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        event_hash = compute_event_hash(last_hash, event_data)
        event = AuditEvent(
            event_id=uuid.uuid4(),
            actor_id=actor_id,
            actor_email=actor_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            previous_hash=last_hash,
            event_hash=event_hash,
        )
        self.db.add(event)
        await self.db.flush()
        return event

    async def _get_last_hash(self) -> str | None:
        result = await self.db.execute(
            select(AuditEvent.event_hash).order_by(desc(AuditEvent.id)).limit(1)
        )
        row = result.scalar_one_or_none()
        return row

    async def get_events(
        self,
        skip: int = 0,
        limit: int = 50,
        actor_id: uuid.UUID | None = None,
        action: str | None = None,
        resource_type: str | None = None,
    ) -> tuple[list[AuditEvent], int]:
        query = select(AuditEvent)
        count_query = select(func.count(AuditEvent.id))
        if actor_id:
            query = query.where(AuditEvent.actor_id == actor_id)
            count_query = count_query.where(AuditEvent.actor_id == actor_id)
        if action:
            query = query.where(AuditEvent.action == action)
            count_query = count_query.where(AuditEvent.action == action)
        if resource_type:
            query = query.where(AuditEvent.resource_type == resource_type)
            count_query = count_query.where(AuditEvent.resource_type == resource_type)
        query = query.order_by(desc(AuditEvent.id)).offset(skip).limit(limit)
        total = await self.db.execute(count_query)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total.scalar_one()

    async def verify_chain(self) -> bool:
        result = await self.db.execute(
            select(AuditEvent).order_by(AuditEvent.id).limit(1)
        )
        first = result.scalar_one_or_none()
        if not first:
            return True
        if first.previous_hash is not None:
            return False
        result = await self.db.execute(
            select(AuditEvent).order_by(AuditEvent.id)
        )
        events = list(result.scalars().all())
        prev_hash = None
        for event in events:
            event_data = {
                "action": event.action,
                "resource_type": event.resource_type,
                "resource_id": event.resource_id,
                "actor_id": str(event.actor_id) if event.actor_id else None,
                "actor_email": event.actor_email,
                "timestamp": event.timestamp.isoformat(),
            }
            expected_hash = compute_event_hash(prev_hash, event_data)
            if event.event_hash != expected_hash:
                return False
            prev_hash = event.event_hash
        return True
