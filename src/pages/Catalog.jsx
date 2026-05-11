import { useEffect, useState } from "react";
import { Search, ShoppingCart, FileText, Phone } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { inventoryAPI } from "@/services/inventory";

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const CATEGORY_LABELS = {
  larga: "Madera Larga",
  corta: "Madera Corta",
  pedido: "Por Pedido",
};

const calcM3 = (largo, ancho, alto) =>
  (parseFloat(largo) * parseFloat(ancho) * parseFloat(alto)) / 10;

const stockBadge = (qty) => {
  if (qty > 50)
    return { className: "bg-success/15 text-success", label: `${qty} pzas` };
  if (qty > 10)
    return {
      className: "bg-accent/15 text-accent-strong",
      label: `Pocas (${qty})`,
    };
  if (qty === 0)
    return { className: "bg-danger/15 text-danger", label: "Agotado" };
  return {
    className: "bg-danger/15 text-danger",
    label: `Últimas (${qty})`,
  };
};

export default function Catalog() {
  const { addToCart, setPage, notify } = useApp();
  const [pieces, setPieces] = useState([]);
  const [woodTypes, setWoodTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [wt, inv] = await Promise.all([
          //inventoryAPI.listWoodTypes({ active_only: true }), el backend no recibe active_only
          inventoryAPI.listWoodTypes(),
          //inventoryAPI.listPieces({ in_stock: false, limit: 200 }), el backend recibe estado
          inventoryAPI.listPieces({ estado: "disponible", limit: 200 }),
        ]);
        setWoodTypes(wt);
        setPieces(inv);
      } catch (err) {
        notify("Error cargando inventario: " + err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [notify]);

const enriched = pieces.map((piece) => {
  const wt = piece.tipo_madera || {};
  const med = piece.medida || {};

  const categoryName = typeof wt.categoria === 'object' 
    ? wt.categoria?.nombre 
    : wt.categoria;

  return {
    id: piece.id,
    woodTypeId: piece.tipo_madera_id,
    woodName: wt.nombre || "?",
    category: categoryName || "",
    emoji: "🪵",
    // El backend usa mm, el front espera metros para mostrar
    largo: piece.largo_mm / 1000, 
    ancho: med.ancho_mm / 1000,
    alto: med.alto_mm / 1000,
    quantity: Number(piece.stock) || 0,
    price: Number(piece.precio_unitario),
    m3: Number(piece.volumen_m3),
  };
});

  const filtered = enriched.filter((item) => {
    const term = search.toLowerCase();
    const matchesSearch =
      item.woodName.toLowerCase().includes(term) ||
      `${item.largo}x${item.ancho}x${item.alto}`.includes(search);
    const matchesFilter =
      activeFilter === "all" || item.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const totalPiezas = pieces.reduce((s, i) => s + (i.stock || 0), 0);

  const FILTERS = [
    ["all", "Todos"],
    ["larga", "Madera Larga"],
    ["corta", "Madera Corta"],
    ["pedido", "Por Pedido"],
  ];

  return (
    <>
      <section className="bg-gradient-to-b from-bg-soft to-bg px-6 md:px-8 py-16 md:py-24 border-b border-border">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs uppercase tracking-[4px] text-accent font-semibold mb-4">
            Maderas Angulo — Buenaventura, Valle del Cauca
          </div>
          <h1 className="font-display font-black text-4xl md:text-6xl text-primary leading-tight mb-4">
            Madera de <em className="text-accent not-italic">calidad</em>
            <br />
            directo del Pacífico
          </h1>
          <p className="text-text-muted text-base md:text-lg max-w-2xl mx-auto mb-8">
            Inventario actualizado en tiempo real. Cubicación automática.
            Cotizaciones al instante para tu proyecto o construcción.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                document
                  .getElementById("catalog-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <ShoppingCart size={16} /> Ver Catálogo
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPage("quotation")}
            >
              <FileText size={16} /> Solicitar Cotización
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { num: loading ? "…" : totalPiezas, label: "Piezas en Stock" },
              {
                num: loading ? "…" : woodTypes.length,
                label: "Tipos de Madera",
              },
              { num: "24h", label: "Tiempo de Respuesta" },
              { num: "+10", label: "Años de Experiencia" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-border rounded-xl px-4 py-5 shadow-sm"
              >
                <div className="font-display font-black text-2xl md:text-3xl text-primary">
                  {stat.num}
                </div>
                <div className="text-xs text-text-muted uppercase tracking-wide mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="max-w-7xl mx-auto px-6 md:px-8 py-12"
        id="catalog-section"
      >
        <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
          <div>
            <h2 className="font-display font-black text-3xl text-primary">
              Catálogo de <span className="text-accent">Productos</span>
            </h2>
            <p className="text-sm text-text-muted mt-1">
              {loading
                ? "Cargando…"
                : `${filtered.length} productos disponibles`}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setPage("quotation")}
          >
            <FileText size={14} /> Cotización personalizada
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
            />
            <input
              className="form-input pl-10"
              placeholder="Buscar por tipo, medidas…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(([val, label]) => (
              <button
                type="button"
                key={val}
                className={
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer " +
                  (activeFilter === val
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-text-muted border-border hover:border-primary hover:text-primary")
                }
                onClick={() => setActiveFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-text-subtle">
            <div className="text-5xl mb-4">🪵</div>
            <p>Cargando inventario…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-subtle">
            <div className="text-5xl mb-4">🔍</div>
            <p>No se encontraron productos con ese criterio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => {
              const badge = stockBadge(item.quantity);
              return (
                <div
                  key={item.id}
                  className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:border-primary hover:shadow-md transition flex flex-col"
                >
                  <div className="relative h-36 bg-gradient-to-br from-bg-soft to-surface flex items-center justify-center text-6xl">
                    <span>{item.emoji}</span>
                    <span className="absolute top-3 left-3 bg-primary/90 text-white text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                    <span
                      className={
                        "absolute top-3 right-3 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full " +
                        badge.className
                      }
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="font-display font-bold text-lg text-text mb-2">
                      {item.woodName}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-[11px] bg-surface-2 text-text-muted px-2 py-0.5 rounded">
                        L: {item.largo}m
                      </span>
                      <span className="text-[11px] bg-surface-2 text-text-muted px-2 py-0.5 rounded">
                        A: {item.ancho}m
                      </span>
                      <span className="text-[11px] bg-surface-2 text-text-muted px-2 py-0.5 rounded">
                        Al: {item.alto}m
                      </span>
                      <span className="text-[11px] bg-surface-2 text-text-muted px-2 py-0.5 rounded">
                        Vol: {item.m3.toFixed(4)}m³
                      </span>
                    </div>
                    <div className="font-display font-black text-2xl text-primary">
                      {fmt(item.price)}
                    </div>
                    <div className="text-xs text-text-subtle mb-4">
                      por pieza · {item.quantity} disponibles
                    </div>
                    <div className="mt-auto flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm flex-1"
                        disabled={item.quantity === 0}
                        onClick={() => addToCart(item)}
                      >
                        <ShoppingCart size={14} />
                        {item.quantity === 0 ? "Agotado" : "Agregar"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => setPage("quotation")}
                        title="Cotizar"
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 bg-surface border border-border rounded-2xl px-6 md:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-display font-bold text-lg text-text">
              ¿Necesitas más información?
            </div>
            <div className="text-sm text-text-muted">
              Contáctanos directamente para pedidos especiales o consultas de
              volumen.
            </div>
          </div>
          <a
            href="https://wa.me/573001234567"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            <Phone size={16} /> Contactar Vendedor
          </a>
        </div>
      </section>
    </>
  );
}