import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/[locale]/register/page";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/en",
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: {
      common: {
        register: "Create Account",
        email: "Email",
        password: "Password",
        loading: "Loading...",
      },
      nav: { home: "Home" },
    },
    locale: "en",
    dir: "ltr",
  }),
}));

beforeEach(() => {
  mockPush.mockClear();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("RegisterPage", () => {
  it("renders the registration form", () => {
    render(<RegisterPage />);
    const headings = screen.getAllByText("Create Account");
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });

  it("shows error on failed registration", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Registration failed"));

    render(<RegisterPage />);

    const emailInput = screen.getByRole("textbox");
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    await userEvent.type(emailInput, "test@test.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(screen.getByText("Registration failed")).toBeInTheDocument();
    });
  });

  it("navigates to login on successful registration", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "new-user-id" }),
    });

    render(<RegisterPage />);

    const emailInput = screen.getByRole("textbox");
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    await userEvent.type(emailInput, "newuser@test.com");
    await userEvent.type(passwordInput, "securePass123");
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
