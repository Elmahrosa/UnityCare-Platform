import uuid
from datetime import datetime, timezone, timedelta
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.medical import VitalSigns, Appointment, MedicalRecord, IcdCode, AppointmentStatus
from app.models.user import User
from app.services.medical import MedicalService


class TestVitals:
    async def test_create_vitals(self, client: AsyncClient, test_user: User,
                                  test_patient, provider_headers: dict):
        payload = {
            "heart_rate": 72,
            "oxygen_saturation": 98.5,
            "blood_pressure_systolic": 120,
            "blood_pressure_diastolic": 80,
            "temperature": 37.0,
        }
        resp = await client.post(
            f"/api/v1/iot/{test_user.id}/vitals",
            json=payload,
            headers=provider_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["heart_rate"] == 72
        assert data["oxygen_saturation"] == 98.5
        assert data["user_id"] == str(test_user.id)

    async def test_get_latest_vitals(self, client: AsyncClient, db_session: AsyncSession,
                                     test_user: User, test_patient, auth_headers: dict):
        service = MedicalService(db_session)
        await service.create_vitals(user_id=test_user.id, heart_rate=80)
        await service.create_vitals(user_id=test_user.id, heart_rate=75)
        resp = await client.get(f"/api/v1/iot/{test_user.id}/vitals", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["heart_rate"] == 75

    async def test_get_vitals_history(self, client: AsyncClient, db_session: AsyncSession,
                                       test_user: User, test_patient, auth_headers: dict):
        service = MedicalService(db_session)
        await service.create_vitals(user_id=test_user.id, heart_rate=80)
        await service.create_vitals(user_id=test_user.id, heart_rate=75)
        resp = await client.get(f"/api/v1/iot/{test_user.id}/vitals/history?limit=10", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2


class TestAppointments:
    async def test_create_appointment(self, client: AsyncClient, db_session: AsyncSession,
                                      test_user: User, test_provider: User, provider_headers: dict):
        payload = {
            "patient_id": str(test_user.id),
            "doctor_id": str(test_provider.id),
            "reason": "Checkup",
            "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        }
        resp = await client.post("/api/v1/appointments", json=payload, headers=provider_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["reason"] == "Checkup"
        assert data["status"] == "pending"

    async def test_update_appointment_status(self, client: AsyncClient, db_session: AsyncSession,
                                              test_user: User, test_provider: User, provider_headers: dict):
        service = MedicalService(db_session)
        apt = await service.create_appointment(
            patient_id=test_user.id,
            doctor_id=test_provider.id,
            scheduled_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        payload = {"status": "completed"}
        resp = await client.patch(f"/api/v1/appointments/{apt.id}", json=payload, headers=provider_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"

    async def test_get_appointments_by_doctor(self, client: AsyncClient, db_session: AsyncSession,
                                               test_user: User, test_provider: User, provider_headers: dict):
        service = MedicalService(db_session)
        await service.create_appointment(
            patient_id=test_user.id, doctor_id=test_provider.id,
            scheduled_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        resp = await client.get(f"/api/v1/appointments/doctor/{test_provider.id}", headers=provider_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1

    async def test_get_appointments_by_patient(self, client: AsyncClient, db_session: AsyncSession,
                                                test_user: User, test_provider: User, test_patient,
                                                auth_headers: dict):
        service = MedicalService(db_session)
        await service.create_appointment(
            patient_id=test_user.id, doctor_id=test_provider.id,
            scheduled_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        resp = await client.get(f"/api/v1/appointments/patient/{test_user.id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1

    async def test_delete_appointment(self, client: AsyncClient, db_session: AsyncSession,
                                       test_user: User, test_provider: User, admin_headers: dict):
        service = MedicalService(db_session)
        apt = await service.create_appointment(
            patient_id=test_user.id, doctor_id=test_provider.id,
            scheduled_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        resp = await client.delete(f"/api/v1/appointments/{apt.id}", headers=admin_headers)
        assert resp.status_code == 204


class TestMedicalRecords:
    async def test_create_medical_record(self, client: AsyncClient, db_session: AsyncSession,
                                          test_user: User, test_provider: User, provider_headers: dict):
        payload = {
            "patient_id": str(test_user.id),
            "doctor_id": str(test_provider.id),
            "record_type": "consultation",
            "title": "Annual Checkup",
            "description": "Routine examination",
        }
        resp = await client.post("/api/v1/records", json=payload, headers=provider_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Annual Checkup"
        assert data["record_type"] == "consultation"

    async def test_get_records_by_patient(self, client: AsyncClient, db_session: AsyncSession,
                                           test_user: User, test_provider: User, test_patient,
                                           auth_headers: dict):
        service = MedicalService(db_session)
        await service.create_medical_record(
            patient_id=test_user.id, doctor_id=test_provider.id,
            record_type="lab", title="Blood Test",
        )
        resp = await client.get(f"/api/v1/records/patient/{test_user.id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1


class TestIcdCodes:
    async def test_search_icd_codes(self, client: AsyncClient, db_session: AsyncSession,
                                    provider_headers: dict):
        service = MedicalService(db_session)
        await service.create_icd_code(code="E11", description="Type 2 diabetes mellitus", category="Endocrine")
        await service.create_icd_code(code="I10", description="Essential hypertension", category="Cardiovascular")
        resp = await client.get("/api/v1/icd-codes?q=diabetes", headers=provider_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["code"] == "E11"

    async def test_create_icd_code_duplicate(self, client: AsyncClient, db_session: AsyncSession,
                                              admin_headers: dict):
        service = MedicalService(db_session)
        await service.create_icd_code(code="A00", description="Cholera", category="Infectious")
        payload = {"code": "A00", "description": "Cholera (duplicate)"}
        resp = await client.post("/api/v1/icd-codes", json=payload, headers=admin_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["code"] == "A00"
