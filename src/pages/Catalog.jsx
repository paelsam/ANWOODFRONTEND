import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ShoppingCart, FileText, Phone, Info, ArrowRight, Layers, Clock, Star } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { inventoryAPI } from "@/services/inventory";
import ProductDetailsModal from "@/components/catalog/ProductDetailsModal";
import {
  PieceComparatorProvider,
  ComparatorTray,
  CompareButton,
} from "@/components/catalog/PieceComparator";

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const stockBadge = (qty, status) => {
  if (status && status !== "disponible") {
    return {
      className: "bg-danger/15 text-danger",
      label: status,
    };
  }
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

const categoryMetaFromWoodType = (woodType) => {
  const category = woodType?.categoria;
  if (!category) {
    return {
      key: "sin-categoria",
      label: "Sin categoría",
      strategy: "",
      allowsCubic: false,
    };
  }

  if (typeof category === "string") {
    return {
      key: category.toLowerCase(),
      label: category,
      strategy: "",
      allowsCubic: false,
    };
  }

  const label = category.nombre || "Sin categoría";
  return {
    key: category.id != null ? `cat-${category.id}` : label.toLowerCase(),
    label,
    strategy: category.estrategia_precio || "",
    allowsCubic: Boolean(category.permite_cubicacion),
  };
};

const measureMetaFromPiece = (piece, measuresById) => {
  const pieceMeasure = piece.medida || {};
  const fullMeasure = pieceMeasure.id
    ? measuresById.get(pieceMeasure.id) || pieceMeasure
    : pieceMeasure;

  const widthIn = Number(fullMeasure?.ancho_in ?? pieceMeasure?.ancho_in ?? 0);
  const heightIn = Number(fullMeasure?.alto_in ?? pieceMeasure?.alto_in ?? 0);

  return {
    label:
      fullMeasure?.etiqueta ||
      pieceMeasure?.etiqueta ||
      (widthIn > 0 && heightIn > 0 ? `${widthIn}" x ${heightIn}"` : ""),
    widthIn,
    heightIn,
  };
};

const formatStrategy = (strategy) =>
  strategy ? strategy.replace(/_/g, " ") : "";

function ProductImage({ images, alt, fallbackEmoji = "🪵", intervalMs = 1200 }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState({});
  const intervalRef = useRef(null);

  const validImages = useMemo(
    () => (Array.isArray(images) ? images.filter((url) => !failed[url]) : []),
    [images, failed],
  );

  useEffect(() => {
    if (index > 0 && index >= validImages.length) {
      setIndex(0);
    }
  }, [index, validImages.length]);

  const stopCycling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleEnter = () => {
    if (validImages.length < 2) return;
    setIndex((prev) => (prev + 1) % validImages.length);
    if (validImages.length > 2) {
      stopCycling();
      intervalRef.current = setInterval(() => {
        setIndex((prev) => (prev + 1) % validImages.length);
      }, intervalMs);
    }
  };

  const handleLeave = () => {
    stopCycling();
    setIndex(0);
  };

  useEffect(() => stopCycling, []);

  if (validImages.length === 0) {
    return <span>{fallbackEmoji}</span>;
  }

  const currentSrc = validImages[index] || validImages[0];

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {validImages.map((src) => (
        <img
          key={src}
          src={src}
          alt={alt}
          loading="lazy"
          aria-hidden={src !== currentSrc}
          onError={() => setFailed((prev) => ({ ...prev, [src]: true }))}
          className={
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300 " +
            (src === currentSrc ? "opacity-100" : "opacity-0")
          }
        />
      ))}
      {validImages.length > 1 ? (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
          {validImages.map((src, i) => (
            <span
              key={src}
              className={
                "w-1.5 h-1.5 rounded-full transition-colors " +
                (i === index ? "bg-white" : "bg-white/50")
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CatalogInner() {
  const { addToCart, cart, setPage, notify, user } = useApp();
  const [pieces, setPieces] = useState([]);
  const [woodTypes, setWoodTypes] = useState([]);
  const [measures, setMeasures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [wt, inv, measureList] = await Promise.all([
          inventoryAPI.listWoodTypes(),
          inventoryAPI.listPieces({ estado: "disponible", limit: 200 }),
          inventoryAPI.listMeasures(),
        ]);
        setWoodTypes(wt);
        setPieces(inv);
        setMeasures(measureList);
      } catch (err) {
        notify("Error cargando inventario: " + err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [notify]);

  const measuresById = useMemo(
    () => new Map(measures.map((measure) => [measure.id, measure])),
    [measures],
  );

  const woodTypesById = useMemo(
    () => new Map(woodTypes.map((woodType) => [woodType.id, woodType])),
    [woodTypes],
  );

  const cartQuantityMap = useMemo(() => {
    const map = new Map();
    cart.forEach((item) => {
      const id = item.pieceId ?? item.id;
      map.set(id, (map.get(id) ?? 0) + (item.qty ?? 1));
    });
    return map;
  }, [cart]);

  const enriched = useMemo(
    () =>
      pieces.map((piece) => {
        const woodType =
          piece.tipo_madera ||
          woodTypesById.get(
            piece.tipo_madera_id || piece.wood_type_id || piece.woodTypeId,
          ) ||
          {};
        const category = categoryMetaFromWoodType(woodType);
        const measure = measureMetaFromPiece(piece, measuresById);
        const largo = Number(piece.largo_m ?? 0) || 0;
        const stockBase = Number(piece.stock ?? piece.quantity ?? 0) || 0;
        const inCart = cartQuantityMap.get(piece.id) ?? 0;
        const quantity = Math.max(0, stockBase - inCart);
        const images = Array.isArray(woodType.imagenes)
          ? woodType.imagenes.filter(
              (url) => typeof url === "string" && url.trim() !== "",
            )
          : [];

        return {
          id: piece.id,
          images,
          image: images[0] || null,
          woodTypeId:
            piece.tipo_madera_id || piece.wood_type_id || woodType.id || null,
          tipo_madera_id:
            piece.tipo_madera_id || piece.wood_type_id || woodType.id || null,
          measureId: piece.medida?.id || piece.medida_id || null,
          medida_id: piece.medida?.id || piece.medida_id || null,
          woodName: woodType.nombre || woodType.name || "Madera",
          description: woodType.descripcion || "Descripción no disponible",
          categoryKey: category.key,
          categoryLabel: category.label,
          pricingStrategy: category.strategy,
          allowsCubic: category.allowsCubic,
          measureLabel: measure.label,
          emoji: "🪵",
          largo,
          ancho: measure.widthIn,
          alto: measure.heightIn,
          ancho_in: measure.widthIn,
          alto_in: measure.heightIn,
          quantity,
          totalQuantity: Number(piece.cantidad ?? piece.quantity ?? stockBase) || 0,
          price: Number(piece.precio_unitario ?? piece.unit_price ?? 0) || 0,
          m3: Number(piece.volumen_m3 ?? 0) || 0,
          status: piece.estado || "disponible",
        };
      }),
    [measuresById, pieces, woodTypesById, cartQuantityMap],
  );

  const filterOptions = useMemo(() => {
    const seen = new Map();
    enriched.forEach((item) => {
      if (item.categoryKey && !seen.has(item.categoryKey)) {
        seen.set(item.categoryKey, item.categoryLabel);
      }
    });

    return [
      { id: "all", label: "Todos" },
      ...Array.from(seen.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, label]) => ({ id, label })),
    ];
  }, [enriched]);

  useEffect(() => {
    if (
      activeFilter !== "all" &&
      !filterOptions.some((filter) => filter.id === activeFilter)
    ) {
      setActiveFilter("all");
    }
  }, [activeFilter, filterOptions]);

  const filtered = enriched.filter((item) => {
    const term = search.toLowerCase();
    const haystack = [
      item.woodName,
      item.categoryLabel,
      item.measureLabel,
      formatStrategy(item.pricingStrategy),
      `${item.largo}x${item.ancho}x${item.alto}`,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = haystack.includes(term);
    const matchesFilter =
      activeFilter === "all" || item.categoryKey === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const totalPiezas = enriched.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <section className="bg-linear-to-b from-bg-soft to-bg px-6 md:px-8 py-16 md:py-24 border-b border-border">
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
            {filterOptions.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer " +
                  (activeFilter === filter.id
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-text-muted border-border hover:border-primary hover:text-primary")
                }
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
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
              const badge = stockBadge(item.quantity, item.status);
              const isUnavailable = item.quantity === 0 || item.status !== "disponible";
              
              return (
                <div
                  key={item.id}
                  className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:border-primary hover:shadow-md transition flex flex-col"
                >
                  <div className="relative h-36 bg-linear-to-br from-bg-soft to-surface flex items-center justify-center text-6xl overflow-hidden">
                    <ProductImage
                      images={item.images}
                      alt={item.woodName}
                      fallbackEmoji={item.emoji}
                    />

                    <span className="absolute top-3 left-3 bg-primary/90 text-white text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full">
                      {item.categoryLabel}
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
                      {item.measureLabel ? (
                        <span className="text-[11px] bg-surface-2 text-text-muted px-2 py-0.5 rounded">
                          Medida: {item.measureLabel}
                        </span>
                      ) : null}
                      {item.pricingStrategy ? (
                        <span className="text-[11px] bg-surface-2 text-text-muted px-2 py-0.5 rounded">
                          Precio: {formatStrategy(item.pricingStrategy)}
                        </span>
                      ) : null}
                      {item.allowsCubic ? (
                        <span className="text-[11px] bg-surface-2 text-text-muted px-2 py-0.5 rounded">
                          Cubicable
                        </span>
                      ) : null}
                      {item.largo > 0 ? (
                        <span className="text-[11px] bg-surface-2 text-text-muted px-2 py-0.5 rounded">
                          L: {item.largo.toFixed(2)}m
                        </span>
                      ) : null}
                      {item.ancho > 0 ? (
                        <span className="text-[11px] bg-surface-2 text-text-muted px-2 py-0.5 rounded">
                          A: {item.ancho.toFixed(1)}"
                        </span>
                      ) : null}
                      {item.alto > 0 ? (
                        <span className="text-[11px] bg-surface-2 text-text-muted px-2 py-0.5 rounded">
                          Al: {item.alto.toFixed(1)}"
                        </span>
                      ) : null}
                      {item.m3 > 0 ? (
                        <span className="text-[11px] bg-surface-2 text-text-muted px-2 py-0.5 rounded">
                          Vol: {item.m3.toFixed(4)}m³
                        </span>
                      ) : null}
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
                        disabled={
                          !user ||
                          item.quantity === 0 ||
                          item.status !== "disponible"
                        }
                        onClick={() => {
                          if (!user) {
                            notify(
                              "Inicia sesion para agregar productos",
                              "error",
                            );
                            setPage("login");
                            return;
                          }
                          addToCart(item);
                        }}
                      >
                        <ShoppingCart size={14} />
                        {isUnavailable ? "No disponible" : "Agregar"}
                      </button>
                      <CompareButton item={item} />
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon border border-border shadow-xs hover:bg-surface-2"
                        onClick={() => setSelectedItem(item)}
                        title="Detalles"
                      >
                        <Info size={14} className="text-accent" />
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
      
      {selectedItem && (
        <ProductDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
      
      <ComparatorTray addToCartFn={addToCart} />
    </>
  );
}

export default function Catalog() {
  return (
    <PieceComparatorProvider>
      <CatalogInner />
    </PieceComparatorProvider>
  );
}
