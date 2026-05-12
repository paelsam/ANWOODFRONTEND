import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Footer from "@/components/layout/Footer";

describe("Footer", () => {
  it("muestra la información institucional", () => {
    render(<Footer />);

    expect(screen.getByText("ANGWOOD")).toBeInTheDocument();
    expect(
      screen.getByText("Maderas Angulo — Buenaventura, Valle del Cauca"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Todos los derechos reservados/)).toBeInTheDocument();
  });
});
