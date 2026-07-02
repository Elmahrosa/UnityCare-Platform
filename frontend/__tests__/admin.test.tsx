import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminDashboard from "@/app/[locale]/admin/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/en",
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: {
      common: { error: "Error", loading: "Loading..." },
      admin: { users: "Users", auditLogs: "Audit Logs" },
      nav: { home: "Home" },
    },
    locale: "en",
    dir: "ltr",
  }),
}));

beforeEach(() => {
  localStorage.clear();
});

describe("AdminDashboard", () => {
  it("renders user list from mock data when no token", async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText("Dr. Sarah Al-Mansour")).toBeInTheDocument();
    });
  });

  it("switches content when clicking audit tab", async () => {
    render(<AdminDashboard />);
    await screen.findByText("Dr. Sarah Al-Mansour");
    const auditBtn = screen.getByText("Audit Logs");
    await userEvent.click(auditBtn);
    const actions = await screen.findAllByText(/user\.login|consent\.created|patient\.created|health/);
    expect(actions.length).toBeGreaterThanOrEqual(1);
  });

  it("shows user roles in the list", async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getAllByText("patient").length).toBeGreaterThanOrEqual(1);
    });
  });
});
