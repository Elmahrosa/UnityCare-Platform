export const DEMO_MODE = true;

export const mockUser = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  email: "admin@unitycare.demo",
  full_name: "Dr. Sarah Al-Mansour",
  role: "admin",
  mfa_enabled: false,
  is_active: true,
  locale: "en",
  created_at: "2026-01-15T08:00:00Z",
};

export const mockUsers = [
  mockUser,
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    email: "doctor.ahmed@unitycare.demo",
    full_name: "Dr. Ahmed Al-Qahtani",
    role: "provider",
    mfa_enabled: true,
    is_active: true,
    locale: "ar",
    created_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    email: "patient.nora@unitycare.demo",
    full_name: "Nora Al-Saud",
    role: "patient",
    mfa_enabled: false,
    is_active: true,
    locale: "ar",
    created_at: "2026-02-01T12:00:00Z",
  },
  {
    id: "d4e5f6a7-b8c9-0123-defa-234567890123",
    email: "patient.omar@unitycare.demo",
    full_name: "Omar Khaled",
    role: "patient",
    mfa_enabled: false,
    is_active: true,
    locale: "en",
    created_at: "2026-02-05T14:00:00Z",
  },
  {
    id: "e5f6a7b8-c9d0-1234-efab-345678901234",
    email: "patient.layla@unitycare.demo",
    full_name: "Layla Hassan",
    role: "patient",
    mfa_enabled: false,
    is_active: true,
    locale: "en",
    created_at: "2026-02-10T09:00:00Z",
  },
];

export const mockVitals: Record<string, any> = {
  "a1b2c3d4": {
    heartRate: 72,
    oxygenSaturation: 98,
    bloodPressure: "118/76",
    temperature: 36.7,
  },
  "b2c3d4e5": {
    heartRate: 68,
    oxygenSaturation: 97,
    bloodPressure: "128/82",
    temperature: 36.5,
  },
};

export const mockConsents = [
  {
    id: "f6a7b8c9-d0e1-2345-fabc-456789012345",
    patient_id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    purpose: "treatment",
    status: "active",
    jurisdiction: "SA",
    version: 1,
    created_at: "2026-02-15T10:00:00Z",
    updated_at: "2026-02-15T10:00:00Z",
  },
  {
    id: "a7b8c9d0-e1f2-3456-abcd-567890123456",
    patient_id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    purpose: "research",
    status: "active",
    jurisdiction: "SA",
    version: 1,
    created_at: "2026-02-16T11:00:00Z",
    updated_at: "2026-02-16T11:00:00Z",
  },
  {
    id: "b8c9d0e1-f2a3-4567-bcde-678901234567",
    patient_id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    purpose: "data_sharing",
    status: "active",
    jurisdiction: "GCC",
    version: 1,
    created_at: "2026-03-01T08:00:00Z",
    updated_at: "2026-03-01T08:00:00Z",
  },
  {
    id: "c9d0e1f2-a3b4-5678-cdef-789012345678",
    patient_id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    purpose: "ai_processing",
    status: "revoked",
    jurisdiction: "SA",
    version: 2,
    created_at: "2026-03-10T09:00:00Z",
    updated_at: "2026-03-15T16:00:00Z",
  },
];

export const mockDoctorProfile = {
  specialization: "Cardiology",
  rating: 4.8,
  licenseNumber: "MED-KSA-2024-18472",
  yearsOfExperience: 14,
  consultationFee: 350,
  totalConsultations: 2841,
};

export const mockAppointments = [
  {
    id: "d0e1f2a3-b4c5-6789-defa-890123456789",
    patientId: "P-1023456789",
    patient: "Nora Al-Saud",
    doctorId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    status: "completed",
    reason: "Annual cardiac checkup",
    date: new Date().toISOString(),
    scheduledAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    notes: "ECG normal. BP slightly elevated. Follow up in 6 months.",
  },
  {
    id: "e1f2a3b4-c5d6-7890-efab-901234567890",
    patientId: "P-1034567890",
    patient: "Layla Hassan",
    doctorId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    status: "in_progress",
    reason: "Chest discomfort follow-up",
    date: new Date().toISOString(),
    scheduledAt: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    notes: "Patient reports occasional chest tightness. Ordered ECHO.",
  },
  {
    id: "f2a3b4c5-d6e7-8901-fabc-012345678901",
    patientId: "P-1012345678",
    patient: "Omar Khaled",
    doctorId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    status: "pending",
    reason: "ECG results review",
    date: new Date().toISOString(),
    scheduledAt: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    notes: "Review Holter monitor results from last week.",
  },
];

export const mockAuditEvents = [
  { id: 1, event_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", action: "user.login", resource_type: "session", resource_id: null, timestamp: "2026-06-19T08:00:00Z", actor_email: "admin@unitycare.demo", details: { method: "password" } },
  { id: 2, event_id: "b2c3d4e5-f6a7-8901-bcde-f1234567890", action: "consent.created", resource_type: "consent", resource_id: "f6a7b8c9-d0e1", timestamp: "2026-06-19T08:30:00Z", actor_email: "admin@unitycare.demo", details: { purpose: "treatment" } },
  { id: 3, event_id: "c3d4e5f6-a7b8-9012-cdef-1234567890", action: "patient.created", resource_type: "patient", resource_id: "P-1012345678", timestamp: "2026-06-19T09:00:00Z", actor_email: "admin@unitycare.demo", details: {} },
  { id: 4, event_id: "d4e5f6a7-b8c9-0123-defa-2345678901", action: "user.login", resource_type: "session", resource_id: null, timestamp: "2026-06-19T09:15:00Z", actor_email: "doctor.ahmed@unitycare.demo", details: { method: "password" } },
  { id: 5, event_id: "e5f6a7b8-c9d0-1234-efab-3456789012", action: "consent.revoked", resource_type: "consent", resource_id: "c9d0e1f2-a3b4", timestamp: "2026-06-19T10:00:00Z", actor_email: "patient.nora@unitycare.demo", details: { reason: "Patient request" } },
];
