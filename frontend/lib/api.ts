import {
  DEMO_MODE,
  mockUser,
  mockUsers,
  mockVitals,
  mockConsents,
  mockAppointments,
  mockAuditEvents,
} from "./mock-data";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("unitycare_token") || localStorage.getItem("token")
  );
}

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

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
  } catch (err: any) {
    clearTimeout(timeout);
    if (DEMO_MODE) {
      return mockFallback<T>(method, path, body);
    }
    throw err;
  }
}

function mockFallback<T>(method: string, path: string, body?: any): T {
  if (path === "/auth/login") {
    const data = body as any;
    const user =
      mockUsers.find((u) => u.email === data?.email) || mockUsers[0];
    return {
      access_token: `mock-token-${user.id}`,
      refresh_token: `mock-refresh-${user.id}`,
      token_type: "bearer",
      expires_in: 900,
    } as T;
  }

  if (path === "/auth/register") {
    return { id: crypto.randomUUID(), ...body } as T;
  }

  if (path === "/users/me" || path === "/admin/users/me") {
    return mockUser as T;
  }

  if (path === "/admin/users") {
    return mockUsers as T;
  }

  if (method === "GET" && path.startsWith("/consent/patient/")) {
    return mockConsents as T;
  }

  if (method === "GET" && path.startsWith("/iot/") && path.endsWith("/vitals")) {
    const match = path.match(/\/iot\/([^/]+)\/vitals/);
    if (match) {
      const vitals = mockVitals[match[1]] || mockVitals["a1b2c3d4"];
      return vitals as T;
    }
  }

  if (method === "GET" && path.startsWith("/appointments/doctor/")) {
    return { appointments: mockAppointments } as T;
  }

  if (method === "GET" && path.startsWith("/appointments/patient/")) {
    return { appointments: mockAppointments.slice(0, 2) } as T;
  }

  if (method === "POST" && path.startsWith("/appointments")) {
    return { id: crypto.randomUUID(), ...body } as T;
  }

  if (method === "GET" && path.startsWith("/records/patient/")) {
    return [] as T;
  }

  if (method === "GET" && path === "/audit/events") {
    return mockAuditEvents as T;
  }

  if (method === "GET" && path === "/audit/verify") {
    return { chain_valid: true } as T;
  }

  return [] as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    request("POST", "/auth/login", { email, password }),
  register: (data: any) => request("POST", "/auth/register", data),
  logout: () => request("POST", "/auth/logout"),
  me: () => request("GET", "/users/me"),
};

export const appointmentApi = {
  create: (data: any) => request("POST", "/appointments", data),
  getByPatient: (patientId: string) =>
    request("GET", `/appointments/patient/${patientId}`),
  getByDoctor: (doctorId: string) =>
    request("GET", `/appointments/doctor/${doctorId}`),
  update: (id: string, data: any) =>
    request("PATCH", `/appointments/${id}`, data),
  delete: (id: string) => request("DELETE", `/appointments/${id}`),
};

export const medicalRecordApi = {
  getByPatient: (patientId: string) =>
    request("GET", `/records/patient/${patientId}`),
  get: (id: string) => request("GET", `/records/${id}`),
};
