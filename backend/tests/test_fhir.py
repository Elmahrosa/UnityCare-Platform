import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.patient import Patient
from app.services.fhir import FHIRService


class TestFHIRPatient:
    async def test_create_fhir_patient(self, client: AsyncClient, admin_headers: dict):
        fhir_id = str(uuid.uuid4())
        payload = {
            "fhir_resource": {
                "resourceType": "Patient",
                "id": fhir_id,
                "name": [{"family": "Doe", "given": ["John"]}],
            }
        }
        resp = await client.post("/api/v1/fhir/Patient", json=payload, headers=admin_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["fhir_id"] == fhir_id
        assert data["is_active"] is True
        assert data["version_id"] == 1

    async def test_get_fhir_patient(self, client: AsyncClient, db_session: AsyncSession,
                                    admin_headers: dict):
        fhir = FHIRService(db_session)
        fhir_id = str(uuid.uuid4())
        patient = await fhir.create_patient({
            "resourceType": "Patient", "id": fhir_id,
        })
        resp = await client.get(f"/api/v1/fhir/Patient/{fhir_id}", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["fhir_id"] == fhir_id

    async def test_update_fhir_patient(self, client: AsyncClient, db_session: AsyncSession,
                                       admin_headers: dict):
        fhir = FHIRService(db_session)
        fhir_id = str(uuid.uuid4())
        await fhir.create_patient({"resourceType": "Patient", "id": fhir_id, "name": "Old"})
        payload = {
            "fhir_resource": {
                "resourceType": "Patient", "id": fhir_id, "name": "Updated",
            }
        }
        resp = await client.put(f"/api/v1/fhir/Patient/{fhir_id}", json=payload, headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["version_id"] == 2
        assert data["fhir_resource"]["name"] == "Updated"

    async def test_soft_delete_fhir_patient(self, client: AsyncClient, db_session: AsyncSession,
                                            admin_headers: dict):
        fhir = FHIRService(db_session)
        fhir_id = str(uuid.uuid4())
        await fhir.create_patient({"resourceType": "Patient", "id": fhir_id})
        resp = await client.delete(f"/api/v1/fhir/Patient/{fhir_id}", headers=admin_headers)
        assert resp.status_code == 204

        # Verify soft delete
        patient = await fhir.get_patient(fhir_id)
        assert patient is None

        # Direct DB check
        result = await db_session.execute(select(Patient).where(Patient.fhir_id == fhir_id))
        db_patient = result.scalar_one()
        assert db_patient.is_active is False

    async def test_search_patients(self, client: AsyncClient, db_session: AsyncSession,
                                   admin_headers: dict):
        fhir = FHIRService(db_session)
        for i in range(3):
            await fhir.create_patient({
                "resourceType": "Patient",
                "id": str(uuid.uuid4()),
                "name": f"Patient {i}",
            })
        resp = await client.get("/api/v1/fhir/Patient", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 3
