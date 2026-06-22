import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/inventory", () => ({
  inventoryAPI: {
    listWoodTypes: vi.fn(),
    listCategories: vi.fn(),
    listMeasures: vi.fn(),
  },
}));

vi.mock("@/components/admin/MetricsTab", () => ({
  default: () => <div>Metrics Tab</div>,
}));
vi.mock("@/components/admin/CategoriesTab", () => ({
  default: () => <div>Categories Tab</div>,
}));
vi.mock("@/components/admin/ClientsTab", () => ({
  default: () => <div>Clients Tab</div>,
}));
vi.mock("@/components/admin/InventoryTab", () => ({
  default: () => <div>Inventory Tab</div>,
}));
vi.mock("@/components/admin/QuotationsTab", () => ({
  default: () => <div>Quotations Tab</div>,
}));
vi.mock("@/components/admin/UsersTab", () => ({
  default: () => <div>Users Tab</div>,
}));
vi.mock("@/components/admin/WoodTypesTab", () => ({
  default: () => <div>WoodTypes Tab</div>,
}));
vi.mock("@/components/admin/ConfigurationTab", () => ({
  default: () => <div>Configuration Tab</div>,
}));
vi.mock("@/components/admin/AdminChatbot", () => ({
  default: () => <div>Chatbot Tab</div>,
}));

import { inventoryAPI } from "@/services/inventory";
import Admin from "@/pages/Admin";
import { adminUserFixture, categoryFixture, measureFixture, woodTypeFixture } from "@/test/fixtures";
import { renderWithApp } from "@/test/helpers/renderWithApp";

describe("Admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inventoryAPI.listWoodTypes.mockResolvedValue([woodTypeFixture]);
    inventoryAPI.listCategories.mockResolvedValue([categoryFixture]);
    inventoryAPI.listMeasures.mockResolvedValue([measureFixture]);
  });

  it("bloquea acceso a no administradores", async () => {
    const user = userEvent.setup();
    const { ctx } = renderWithApp(<Admin />, { user: null });

    expect(screen.getByText("Acceso restringido")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Iniciar sesión/i }));
    expect(ctx.setPage).toHaveBeenCalledWith("login");
  });

  it("carga catálogos y permite cambiar entre tabs", async () => {
    const user = userEvent.setup();
    renderWithApp(<Admin />, { user: adminUserFixture });

    expect(await screen.findByText("Metrics Tab")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Inventario/i }));
    expect(screen.getByText("Inventory Tab")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Usuarios/i }));
    expect(screen.getByText("Users Tab")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Configuración/i }));
    expect(screen.getByText("Configuration Tab")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Asistente IA/i }));
    expect(screen.getByText("Chatbot Tab")).toBeInTheDocument();
  });
});
