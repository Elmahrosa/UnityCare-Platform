import axios from "axios";

declare const api: typeof axios;

export const authApi: {
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  refresh: (token: string) => Promise<any>;
  logout: () => Promise<any>;
  me: () => Promise<any>;
};

export const appointmentApi: {
  create: (data: any) => Promise<any>;
  getByPatient: (patientId: string) => Promise<any>;
  getByDoctor: (doctorId: string) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
};

export const medicalRecordApi: {
  create: (data: any) => Promise<any>;
  getByPatient: (patientId: string) => Promise<any>;
  get: (id: string) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
};

export default api;
