import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Mocks ----
const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  Link: ({ children, ...rest }: React.ComponentProps<"a">) => <a {...rest}>{children}</a>,
  useNavigate: () => navigateMock,
}));

// useServerFn returns the wrapped fn as-is so we can control it via billing.functions mock
vi.mock("@tanstack/react-start", () => ({
  useServerFn: (fn: unknown) => fn,
}));

const getSubscriptionMock = vi.fn();
const subscribeToPlanMock = vi.fn();
const extendTrialMock = vi.fn();
vi.mock("@/lib/billing.functions", () => ({
  getSubscription: (...a: unknown[]) => getSubscriptionMock(...a),
  subscribeToPlan: (...a: unknown[]) => subscribeToPlanMock(...a),
  extendTrial: (...a: unknown[]) => extendTrialMock(...a),
}));

const useAuthMock = vi.fn();
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("./index", () => ({ Logo: () => <span data-testid="logo" /> }));

const toastInfo = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { info: toastInfo, success: toastSuccess, error: toastError },
}));

// Import AFTER mocks are registered
import { PlansPage } from "./planos";

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <PlansPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getSubscriptionMock.mockResolvedValue(null);
});

describe("/planos — botão Aproveite: teste 30 dias", () => {
  it("usuário não logado é redirecionado para /signup ao clicar", async () => {
    useAuthMock.mockReturnValue({
      session: null,
      user: null,
      loading: false,
      isAdmin: false,
      roleLoading: false,
    });

    renderPage();

    const button = await screen.findByRole("button", {
      name: /aproveite.*teste 30 dias/i,
    });
    await userEvent.click(button);

    expect(extendTrialMock).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith({ to: "/signup" });
    expect(toastInfo).toHaveBeenCalledWith(
      expect.stringMatching(/crie sua conta/i),
    );
  });

  it("usuário logado dispara extendTrial e navega para /app", async () => {
    useAuthMock.mockReturnValue({
      session: { user: { id: "u1" } },
      user: { id: "u1" },
      loading: false,
      isAdmin: false,
      roleLoading: false,
    });
    getSubscriptionMock.mockResolvedValue({
      plan: "trial",
      status: "trialing",
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 5 * 86400000).toISOString(),
      subscription_started_at: null,
      cancel_requested_at: null,
      days_left_trial: 5,
      trial_expired: false,
      can_cancel: false,
      days_until_cancel_allowed: 0,
    });
    extendTrialMock.mockResolvedValue({});

    renderPage();

    const button = await screen.findByRole("button", {
      name: /aproveite.*teste 30 dias/i,
    });
    await userEvent.click(button);

    await waitFor(() => expect(extendTrialMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith({ to: "/app" }),
    );
    expect(toastSuccess).toHaveBeenCalledWith(
      expect.stringMatching(/30 dias liberado/i),
    );
  });

  it("erro do servidor ao estender exibe toast de erro e não navega", async () => {
    useAuthMock.mockReturnValue({
      session: { user: { id: "u1" } },
      user: { id: "u1" },
      loading: false,
      isAdmin: false,
      roleLoading: false,
    });
    extendTrialMock.mockRejectedValue(new Error("Falha!"));

    renderPage();

    const button = await screen.findByRole("button", {
      name: /aproveite.*teste 30 dias/i,
    });
    await userEvent.click(button);

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Falha!"),
    );
    expect(navigateMock).not.toHaveBeenCalledWith({ to: "/app" });
  });
});
