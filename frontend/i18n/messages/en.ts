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
