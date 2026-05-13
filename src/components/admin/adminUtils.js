export const fmtCurrency = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export const formatDecimal = (value, digits = 2) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "—";
  return numeric.toFixed(digits);
};

export const fmtNumber = (value, digits = 2) => formatDecimal(value, digits);

export const parseOptionalNumber = (value) => {
  if (value === "" || value == null) return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

export const categoryMetaFromWoodType = (woodType) => {
  const category = woodType?.categoria;
  if (!category) {
    return {
      id: null,
      name: "Sin categoría",
      strategy: "",
      allowsCubic: false,
    };
  }

  if (typeof category === "string") {
    return {
      id: null,
      name: category,
      strategy: "",
      allowsCubic: false,
    };
  }

  return {
    id: category.id ?? null,
    name: category.nombre || "Sin categoría",
    strategy: category.estrategia_precio || "",
    allowsCubic: Boolean(category.permite_cubicacion),
  };
};

export const formatStrategy = (strategy) =>
  strategy ? strategy.replace(/_/g, " ") : "";

export const stockBadgeTone = (stock) => {
  if (stock > 50) return "badge-success";
  if (stock > 10) return "badge-warning";
  return "badge-danger";
};
