import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Notification from "@/components/layout/Notification";

describe("Notification", () => {
  it("no renderiza nada si notification es null", () => {
    const { container } = render(<Notification notification={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza con la variante correcta", () => {
    render(
      <Notification notification={{ msg: "Hubo un error", type: "error" }} />,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Hubo un error");
    expect(status.className).toContain("bg-danger");
  });
});
