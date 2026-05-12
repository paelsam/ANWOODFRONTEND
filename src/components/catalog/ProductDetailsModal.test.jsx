import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProductDetailsModal from "@/components/catalog/ProductDetailsModal";
import { cartItemFixture } from "@/test/fixtures";

describe("ProductDetailsModal", () => {
  it("no renderiza nada sin item", () => {
    const { container } = render(
      <ProductDetailsModal item={null} onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza detalles del producto y se cierra", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ProductDetailsModal
        item={{
          ...cartItemFixture,
          id: 10,
          categoryLabel: "Estructural",
          description: "Madera para exterior",
          measureLabel: '2" x 4"',
          pricingStrategy: "precio_por_metro",
          status: "disponible",
          largo: 3.2,
          m3: 0.032,
        }}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("Cedro")).toBeInTheDocument();
    expect(screen.getByText("Estructural")).toBeInTheDocument();
    expect(screen.getByText("Madera para exterior")).toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes("precio por metro"),
      ).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalled();
  });
});
