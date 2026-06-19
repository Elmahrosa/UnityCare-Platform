import axios from "axios";

const API_BASE = process.env.API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (data) => api.post("/users/register", data),
  refresh: (token) => api.post("/auth/refresh", { token }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/users/me"),
};

export const appointmentApi = {
  create: (data) => api.post("/appointments", data),
  getByPatient: (patientId) => api.get(`/appointments/patient/${patientId}`),
  getByDoctor: (doctorId) => api.get(`/appointments/doctor/${doctorId}`),
  update: (id, data) => api.patch(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};

export const medicalRecordApi = {
  create: (data) => api.post("/records", data),
  getByPatient: (patientId) => api.get(`/records/patient/${patientId}`),
  get: (id) => api.get(`/records/${id}`),
  update: (id, data) => api.patch(`/records/${id}`, data),
  delete: (id) => api.delete(`/records/${id}`),
};

export default api;
