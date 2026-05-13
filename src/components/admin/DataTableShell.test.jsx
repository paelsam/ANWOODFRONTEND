import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DataTableShell from "@/components/admin/DataTableShell";

describe("DataTableShell", () => {
  it("renderiza título, contador, subtítulo, acción y children", () => {
    render(
      <DataTableShell
        title="Inventario"
        count={3}
        subtitle="Resumen"
        action={<button type="button">Acción</button>}
      >
        <div>Tabla</div>
      </DataTableShell>,
    );

    expect(screen.getByText("Inventario (3)")).toBeInTheDocument();
    expect(screen.getByText("Resumen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Acción" })).toBeInTheDocument();
    expect(screen.getByText("Tabla")).toBeInTheDocument();
  });
});
