import { describe, expect, it } from "vitest";
import {
  formatColombianPricesForSpeech,
  stripMarkdownForSpeech,
} from "@/utils/markdown";

describe("stripMarkdownForSpeech", () => {
  it("elimina negritas e itálicas", () => {
    const input =
      "Te recomiendo **Chaquiro** o **Popa**. La *Madera Corta* cuesta $8.000.";
    const result = stripMarkdownForSpeech(input);

    expect(result).toBe(
      "Te recomiendo Chaquiro o Popa. La Madera Corta cuesta 8 mil pesos.",
    );
    expect(result).not.toContain("*");
    expect(result).not.toContain("$");
  });

  it("convierte saltos de párrafo en espacios", () => {
    const result = stripMarkdownForSpeech("Primer párrafo.\n\nSegundo párrafo.");
    expect(result).toBe("Primer párrafo. Segundo párrafo.");
  });
});

describe("formatColombianPricesForSpeech", () => {
  it("lee precios colombianos en pesos, no en dólares", () => {
    const text =
      "El Chaquiro cuesta $8.000 por metro y la Popa $2.000 por metro.";
    expect(formatColombianPricesForSpeech(text)).toBe(
      "El Chaquiro cuesta 8 mil pesos por metro y la Popa 2 mil pesos por metro.",
    );
  });

  it("maneja millones", () => {
    expect(formatColombianPricesForSpeech("Total $1.500.000")).toBe(
      "Total 1 millón 500 mil pesos",
    );
  });
});
