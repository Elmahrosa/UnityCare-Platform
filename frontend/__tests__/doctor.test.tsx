import { render, screen, waitFor } from "@testing-library/react";
import DoctorDashboard from "@/app/[locale]/doctor/page";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/en",
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: {
      doctor: {
        specialization: "Cardiology",
        rating: "Rating",
        todayPatients: "Today's Patients",
        completed: "Completed",
        inProgress: "In Progress",
        totalConsultations: "Total Consultations",
        patientQueue: "Patient Queue",
        todayAppointments: "Today's Appointments",
        patientId: "Patient",
        generalConsultation: "General Consultation",
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
      nav: { home: "Home" },
    },
    locale: "en",
    dir: "ltr",
  }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "doc-1", name: "Dr. Ahmed", email: "doctor@test.com", role: "provider" },
    loading: false,
    error: null,
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}));

jest.mock("@/lib/api", () => ({
  authApi: {
    me: jest.fn().mockResolvedValue({
      specialization: "Cardiology",
      rating: 4.8,
      licenseNumber: "MED-123",
      yearsOfExperience: 14,
      consultationFee: 350,
      totalConsultations: 2841,
    }),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
  appointmentApi: {
    getByDoctor: jest.fn().mockResolvedValue([
      {
        id: "apt-1",
        patientId: "P-001",
        patient: "Nora Al-Saud",
        status: "completed",
        reason: "Annual checkup",
        date: new Date().toISOString(),
        scheduledAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
      },
      {
        id: "apt-2",
        patientId: "P-002",
        patient: "Layla Hassan",
        status: "in_progress",
        reason: "Follow-up",
        date: new Date().toISOString(),
        scheduledAt: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
      },
    ]),
    create: jest.fn(),
    getByPatient: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  medicalRecordApi: {
    getByPatient: jest.fn(),
    get: jest.fn(),
  },
}));

describe("DoctorDashboard", () => {
  it("renders doctor name and specialization", async () => {
    render(<DoctorDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Dr. Ahmed/)).toBeInTheDocument();
    });
    expect(screen.getByText("Cardiology")).toBeInTheDocument();
  });

  it("renders stat cards with correct values", async () => {
    render(<DoctorDashboard />);
    await waitFor(() => {
      expect(screen.getByText("Today's Patients")).toBeInTheDocument();
    });
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Total Consultations")).toBeInTheDocument();
    expect(screen.getByText("2841")).toBeInTheDocument();
  });

  it("renders appointment queue with patient IDs", async () => {
    render(<DoctorDashboard />);
    await waitFor(() => {
      expect(screen.getByText("Patient Queue")).toBeInTheDocument();
    });
    expect(screen.getByText(/P-001/)).toBeInTheDocument();
    expect(screen.getByText(/P-002/)).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("in_progress")).toBeInTheDocument();
  });

  it("renders quick actions and profile sidebar", async () => {
    render(<DoctorDashboard />);
    await waitFor(() => {
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });
    expect(screen.getByText("View Schedule")).toBeInTheDocument();
    expect(screen.getByText("Create Prescription")).toBeInTheDocument();
    expect(screen.getByText("Medical Records")).toBeInTheDocument();
    expect(screen.getByText("Profile Info")).toBeInTheDocument();
    expect(screen.getByText("MED-123")).toBeInTheDocument();
  });
});
