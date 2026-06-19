import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/[locale]/login/page";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/en",
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: {
      common: {
        login: "Sign In",
        email: "Email",
        password: "Password",
        loading: "Loading...",
        register: "Create Account",
      },
      nav: { home: "Home" },
    },
    locale: "en",
    dir: "ltr",
  }),
}));

beforeEach(() => {
  mockPush.mockClear();
  localStorage.clear();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("LoginPage", () => {
  it("renders the login form", () => {
    render(<LoginPage />);
    const signInElements = screen.getAllByText("Sign In");
    expect(signInElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("shows error on failed login", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Login failed"));

    render(<LoginPage />);

    const emailInput = screen.getAllByRole("textbox")[0];
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    await userEvent.type(emailInput, "test@test.com");
    await userEvent.type(passwordInput, "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Login failed")).toBeInTheDocument();
    });
  });

  it("navigates on successful login", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "test-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "patient" }),
      });

    render(<LoginPage />);

    const emailInput = screen.getAllByRole("textbox")[0];
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    await userEvent.type(emailInput, "test@test.com");
    await userEvent.type(passwordInput, "pass123");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/patient");
    });
  });

  it("renders register link", () => {
    render(<LoginPage />);
    expect(screen.getByText("Create Account")).toBeInTheDocument();
  });
});
