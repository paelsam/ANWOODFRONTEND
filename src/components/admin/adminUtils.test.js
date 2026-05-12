import { describe, expect, it } from "vitest";
import {
  categoryMetaFromWoodType,
  fmtCurrency,
  fmtNumber,
  formatDecimal,
  formatStrategy,
  parseOptionalNumber,
  stockBadgeTone,
} from "@/components/admin/adminUtils";
import {
  categoryFixture,
  categoryStringFixture,
  woodTypeFixture,
} from "@/test/fixtures";

describe("adminUtils", () => {
  it("formatea moneda con locale es-CO", () => {
    const expected = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(123456);

    expect(fmtCurrency(123456)).toBe(expected);
  });

  it("formatea decimales y devuelve guion para NaN", () => {
    expect(formatDecimal(12.3456)).toBe("12.35");
    expect(formatDecimal(12.3456, 3)).toBe("12.346");
    expect(formatDecimal("nope")).toBe("—");
  });

  it("fmtNumber reutiliza formatDecimal", () => {
    expect(fmtNumber(9.876, 1)).toBe("9.9");
  });

  it("parsea números opcionales", () => {
    expect(parseOptionalNumber("")).toBeNull();
    expect(parseOptionalNumber(null)).toBeNull();
    expect(parseOptionalNumber("12.5")).toBe(12.5);
    expect(parseOptionalNumber("abc")).toBeNull();
  });

  it("obtiene metadata por defecto cuando la categoría no existe", () => {
    expect(categoryMetaFromWoodType({})).toEqual({
      id: null,
      name: "Sin categoría",
      strategy: "",
      allowsCubic: false,
    });
  });

  it("obtiene metadata cuando la categoría es string", () => {
    expect(
      categoryMetaFromWoodType({ categoria: categoryStringFixture }),
    ).toEqual({
      id: null,
      name: "Premium",
      strategy: "",
      allowsCubic: false,
    });
  });

  it("obtiene metadata cuando la categoría es objeto", () => {
    expect(categoryMetaFromWoodType(woodTypeFixture)).toEqual({
      id: categoryFixture.id,
      name: categoryFixture.nombre,
      strategy: categoryFixture.estrategia_precio,
      allowsCubic: true,
    });
  });

  it("formatea estrategias y tonos de stock", () => {
    expect(formatStrategy("precio_por_metro")).toBe("precio por metro");
    expect(formatStrategy("")).toBe("");

    expect(stockBadgeTone(60)).toBe("badge-success");
    expect(stockBadgeTone(20)).toBe("badge-warning");
    expect(stockBadgeTone(3)).toBe("badge-danger");
  });
});
