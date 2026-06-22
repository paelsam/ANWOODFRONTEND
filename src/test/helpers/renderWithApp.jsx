import { render } from "@testing-library/react";
import { vi } from "vitest";
import { AppContext } from "@/contexts/AppContext";

export function buildAppContext(overrides = {}) {
  return {
    page: "catalog",
    setPage: vi.fn(),
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    notify: vi.fn(),
    authLoading: false,
    cart: [],
    serverCart: null,
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateCartQty: vi.fn(),
    clearCart: vi.fn(),
    refreshCart: vi.fn(),
    getCartItemCount: vi.fn(() => 0),
    getCartTotal: vi.fn(() => 0),
    refreshServerCart: vi.fn(),
    ...overrides,
  };
}

export function renderWithApp(ui, overrides = {}) {
  const ctx = buildAppContext(overrides);

  return {
    ctx,
    ...render(<AppContext.Provider value={ctx}>{ui}</AppContext.Provider>),
  };
}
