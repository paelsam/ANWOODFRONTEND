import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useNotification", () => ({
  useNotification: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useCart", () => ({
  useCart: vi.fn(),
}));

vi.mock("@/pages/Catalog", () => ({
  default: () => <div>Catalog Page</div>,
}));
vi.mock("@/pages/Login", () => ({
  default: () => <div>Login Page</div>,
}));
vi.mock("@/pages/Admin", () => ({
  default: () => <div>Admin Page</div>,
}));
vi.mock("@/pages/Cart", () => ({
  default: () => <div>Cart Page</div>,
}));
vi.mock("@/pages/Quotation", () => ({
  default: () => <div>Quotation Page</div>,
}));

vi.mock("@/components/layout/Footer", () => ({
  default: () => <div>Footer Mock</div>,
}));

vi.mock("@/components/layout/Notification", () => ({
  default: ({ notification }) => <div>{notification?.msg || "Sin notificación"}</div>,
}));

vi.mock("@/components/layout/Header", async () => {
  const actual = await vi.importActual("@/contexts/AppContext");

  return {
    default: function HeaderMock() {
      const { setPage } = actual.useApp();
      return (
        <button type="button" onClick={() => setPage("login")}>
          Header Mock
        </button>
      );
    },
  };
});

import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useNotification } from "@/hooks/useNotification";
import App from "@/App";

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotification.mockReturnValue({
      notification: { msg: "Todo bien", type: "success" },
      notify: vi.fn(),
    });
    useAuth.mockReturnValue({
      user: { username: "ana" },
      authLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    useCart.mockReturnValue({
      cart: [],
      serverCart: null,
      addToCart: vi.fn(),
      removeFromCart: vi.fn(),
      updateCartQty: vi.fn(),
      clearCart: vi.fn(),
      getCartItemCount: vi.fn(() => 0),
      getCartTotal: vi.fn(() => 0),
    });
  });

  it("muestra loading mientras authLoading es true", () => {
    useAuth.mockReturnValue({
      user: null,
      authLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);

    expect(screen.getByText("Cargando ANGWOOD…")).toBeInTheDocument();
  });

  it("renderiza layout y cambia de página usando el contexto", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("button", { name: "Header Mock" })).toBeInTheDocument();
    expect(screen.getByText("Todo bien")).toBeInTheDocument();
    expect(screen.getByText("Catalog Page")).toBeInTheDocument();
    expect(screen.getByText("Footer Mock")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Header Mock" }));

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
