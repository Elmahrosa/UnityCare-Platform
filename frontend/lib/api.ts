import {
  DEMO_MODE,
  mockUser,
  mockUsers,
  mockVitals,
  mockConsents,
  mockAppointments,
  mockAuditEvents,
  mockIcdCodes,
  mockMedicalRecords,
} from "./mock-data";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("unitycare_token") || localStorage.getItem("token")
  );
}

function requestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function request<T>(method: string, path: string, body?: unknown, attempt = 1): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-Id": requestId(),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

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
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (DEMO_MODE) {
      return mockFallback<T>(method, path, body);
    }
    const typed = err as Error;
    const isRetryable =
      typed.name === "AbortError" ||
      typed.message.includes("Failed to fetch") ||
      typed.message.includes("NetworkError") ||
      typed.message.includes("5");
    if (isRetryable && attempt < 3) {
      await sleep(Math.min(200 * 2 ** attempt, 2000));
      return request<T>(method, path, body, attempt + 1);
    }
    throw err;
  }
}

function mockFallback<T>(method: string, path: string, body?: unknown): T {
  if (path === "/auth/login") {
    const data = body as Record<string, unknown>;
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
    return { id: crypto.randomUUID(), ...(body as Record<string, unknown>) } as T;
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
    return mockAppointments as T;
  }

  if (method === "GET" && path.startsWith("/appointments/patient/")) {
    return mockAppointments.slice(0, 2) as T;
  }

  if (method === "POST" && path.startsWith("/appointments")) {
    return { id: crypto.randomUUID(), ...(body as Record<string, unknown>) } as T;
  }

  if (method === "GET" && path.startsWith("/records/patient/")) {
    return mockMedicalRecords as T;
  }

  if (method === "GET" && path === "/icd-codes") {
    return mockIcdCodes as T;
  }

  if (method === "GET" && path.startsWith("/icd-codes/")) {
    const code = path.replace("/icd-codes/", "");
    const found = mockIcdCodes.find((c) => c.code === code);
    return (found || null) as T;
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
  register: (data: Record<string, unknown>) => request("POST", "/auth/register", data),
  logout: () => request("POST", "/auth/logout"),
  me: () => request("GET", "/admin/users/me"),
};

export const appointmentApi = {
  create: (data: Record<string, unknown>) => request("POST", "/appointments", data),
  getByPatient: (patientId: string) =>
    request("GET", `/appointments/patient/${patientId}`),
  getByDoctor: (doctorId: string) =>
    request("GET", `/appointments/doctor/${doctorId}`),
  update: (id: string, data: Record<string, unknown>) =>
    request("PATCH", `/appointments/${id}`, data),
  delete: (id: string) => request("DELETE", `/appointments/${id}`),
};

export const medicalRecordApi = {
  getByPatient: (patientId: string) =>
    request("GET", `/records/patient/${patientId}`),
  get: (id: string) => request("GET", `/records/${id}`),
};
