const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:8000/api/v1";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("unitycare_token") || localStorage.getItem("token");
}

async function request(method, path, body) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem("unitycare_token");
    localStorage.removeItem("token");
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const authApi = {
  login: (email, password) => request("POST", "/auth/login", { email, password }),
  register: (data) => request("POST", "/auth/register", data),
  logout: () => request("POST", "/auth/logout"),
  me: () => request("GET", "/users/me"),
};

export const appointmentApi = {
  create: (data) => request("POST", "/appointments", data),
  getByPatient: (patientId) => request("GET", `/appointments/patient/${patientId}`),
  getByDoctor: (doctorId) => request("GET", `/appointments/doctor/${doctorId}`),
  update: (id, data) => request("PATCH", `/appointments/${id}`, data),
  delete: (id) => request("DELETE", `/appointments/${id}`),
};

export const medicalRecordApi = {
  getByPatient: (patientId) => request("GET", `/records/patient/${patientId}`),
  get: (id) => request("GET", `/records/${id}`),
};
