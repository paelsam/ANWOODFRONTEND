import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Modal from "@/components/admin/Modal";

describe("Modal", () => {
  it("renderiza título y children", () => {
    render(
      <Modal title="Editar" onClose={vi.fn()}>
        <div>Contenido</div>
      </Modal>,
    );

    expect(screen.getByText("Editar")).toBeInTheDocument();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });

  it("cierra al hacer click en el botón", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal title="Editar" onClose={onClose}>
        <div>Contenido</div>
      </Modal>,
    );

    await user.click(screen.getByRole("button"));

    expect(onClose).toHaveBeenCalled();
  });
});
