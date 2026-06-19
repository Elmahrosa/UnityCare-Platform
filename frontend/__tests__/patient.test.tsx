import { render, screen, waitFor } from "@testing-library/react";
import PatientDashboard from "@/app/[locale]/patient/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/en",
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: {
      common: { loading: "Loading..." },
      patient: { profile: "Patient Dashboard", consents: "My Consents", noConsents: "No consents found." },
      nav: { home: "Home" },
    },
    locale: "en",
    dir: "ltr",
  }),
}));

beforeEach(() => {
  localStorage.clear();
});

describe("PatientDashboard", () => {
  it("renders vital signs and consents from mock data when no token", async () => {
    render(<PatientDashboard />);
    await waitFor(() => {
      expect(screen.getByText("Patient Dashboard")).toBeInTheDocument();
    });
    expect(screen.getByText("My Consents")).toBeInTheDocument();
    expect(screen.getByText("Heart Rate")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("treatment")).toBeInTheDocument();
  });
});
