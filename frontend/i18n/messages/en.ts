export type Locale = 'en' | 'ar';

export interface Translation {
  nav: {
    home: string;
    features: string;
    compliance: string;
    contact: string;
    login: string;
    dashboard: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    learnMore: string;
  };
  features: {
    title: string;
    subtitle: string;
    identity: { title: string; desc: string };
    fhir: { title: string; desc: string };
    consent: { title: string; desc: string };
    audit: { title: string; desc: string };
    security: { title: string; desc: string };
    arabic: { title: string; desc: string };
  };
  compliance: {
    title: string;
    subtitle: string;
    hipaa: string;
    gdpr: string;
    ehhds: string;
    nphies: string;
    soc2: string;
    iso: string;
  };
  patient: {
    profile: string;
    consents: string;
    activity: string;
    noConsents: string;
  };
  doctor: {
    dashboard: string;
    specialization: string;
    rating: string;
    todayPatients: string;
    completed: string;
    inProgress: string;
    totalConsultations: string;
    patientQueue: string;
    todayAppointments: string;
    patientId: string;
    generalConsultation: string;
    noAppointments: string;
    quickActions: string;
    viewSchedule: string;
    createPrescription: string;
    medicalRecords: string;
    profileInfo: string;
    license: string;
    experience: string;
    years: string;
    consultationFee: string;
    continue: string;
    start: string;
  };
  admin: {
    users: string;
    patients: string;
    consents: string;
    auditLogs: string;
  };
  common: {
    loading: string;
    error: string;
    save: string;
    cancel: string;
    delete: string;
    search: string;
    email: string;
    password: string;
    login: string;
    register: string;
    logout: string;
    english: string;
    arabic: string;
  };
}

const en: Translation = {
  nav: {
    home: "Home",
    features: "Features",
    compliance: "Compliance",
    contact: "Contact",
    login: "Sign In",
    dashboard: "Dashboard",
  },
  hero: {
    title: "Healthcare Trust Infrastructure\nfor the Connected World",
    subtitle: "Identity, consent, and interoperability platform powering secure healthcare data exchange across Egypt, GCC, EU, and US markets.",
    cta: "Get Started",
    learnMore: "Learn More",
  },
  features: {
    title: "Enterprise Healthcare Platform",
    subtitle: "Built for regulated healthcare markets from day one",
    identity: { title: "Identity & Access", desc: "Patient and provider identity with MFA, SSO, and role-based access control. FHIR-compliant from day one." },
    fhir: { title: "FHIR R4 Gateway", desc: "Full FHIR R4 API for Patient, Practitioner, and clinical resources. Certified interoperability backbone." },
    consent: { title: "Consent Engine", desc: "Granular consent management for treatment, research, AI processing, data sharing, and cross-border transfer." },
    audit: { title: "Immutable Audit", desc: "Hash-chained audit ledger tracking every healthcare action. Tamper-evident, SIEM-ready, regulation-proof." },
    security: { title: "Zero Trust Security", desc: "OAuth2, OIDC, MFA, encryption at rest and in transit. SOC 2 and HIPAA aligned architecture." },
    arabic: { title: "Arabic-First UX", desc: "Full RTL support with Arabic-language clinical terminology, Hijri calendar, and localized regulatory compliance." },
  },
  compliance: {
    title: "Regulatory Compliance",
    subtitle: "Certification-ready architecture for every market",
    hipaa: "US Health Insurance Portability and Accountability Act",
    gdpr: "EU General Data Protection Regulation",
    ehhds: "European Health Data Space / MyHealth@EU",
    nphies: "Saudi National Platform for Health and Insurance Exchange",
    soc2: "Service Organization Control Type II",
    iso: "Information Security Management",
  },
  patient: {
    profile: "Patient Dashboard",
    consents: "My Consents",
    activity: "Activity Log",
    noConsents: "No consents found.",
  },
  doctor: {
    dashboard: "Doctor Dashboard",
    specialization: "Specialist",
    rating: "Rating",
    todayPatients: "Today's Patients",
    completed: "Completed",
    inProgress: "In Progress",
    totalConsultations: "Total Consultations",
    patientQueue: "Patient Queue",
    todayAppointments: "Today's appointments",
    patientId: "Patient ID",
    generalConsultation: "General consultation",
    noAppointments: "No appointments today",
    quickActions: "Quick Actions",
    viewSchedule: "View Schedule",
    createPrescription: "Create Prescription",
    medicalRecords: "Medical Records",
    profileInfo: "Profile Info",
    license: "License",
    experience: "Experience",
    years: "years",
    consultationFee: "Consultation Fee",
    continue: "Continue",
    start: "Start",
  },
  admin: {
    users: "Admin Dashboard",
    patients: "Patients",
    consents: "Consents",
    auditLogs: "Audit Log",
  },
  common: {
    loading: "Loading...",
    error: "An error occurred",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    search: "Search",
    email: "Email",
    password: "Password",
    login: "Sign In",
    register: "Create Account",
    logout: "Sign Out",
    english: "English",
    arabic: "العربية",
  },
};

export default en;
