/**
 * PieceComparator.jsx
 *
 * Floating comparator tray + full-screen comparison panel.
 *
 * USAGE
 * -----
 * 1.  Drop <PieceComparatorProvider> around your app (wraps AppContext or lives beside it).
 * 2.  Call `useComparator()` anywhere to get { addToCompare, removeFromCompare, items, open, close }.
 * 3.  Render <ComparatorTray /> once at the root level (it positions itself fixed).
 * 4.  In each product card, add the ⊕ button (example at the bottom of this file).
 *
 * The comparator accepts the same `item` shape as the existing Catalog.jsx enriched objects.
 */

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { X, Plus, ShoppingCart, ArrowRight, Scale, ChevronDown, ChevronUp, Minus } from "lucide-react";

/* ─── Constants ────────────────────────────────────────────────────────────── */
const MAX_ITEMS = 3;

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const fmtNum = (n, decimals = 2) =>
  n != null && Number(n) > 0 ? Number(n).toFixed(decimals) : "—";

/* ─── Context ───────────────────────────────────────────────────────────────── */
const ComparatorContext = createContext(null);

export function PieceComparatorProvider({ children }) {
  const [items, setItems] = useState([]);       // up to MAX_ITEMS enriched pieces
  const [panelOpen, setPanelOpen] = useState(false);
  const [trayExpanded, setTrayExpanded] = useState(true);

  const addToCompare = useCallback((item) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;          // already in
      if (prev.length >= MAX_ITEMS) return prev;                    // full
      const next = [...prev, item];
      return next;
    });
    setTrayExpanded(true);
  }, []);

  const removeFromCompare = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setPanelOpen(false);
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setPanelOpen(false);
  }, []);

  const isInCompare = useCallback((id) => items.some((i) => i.id === id), [items]);

  const value = useMemo(() => ({
    items, panelOpen, trayExpanded,
    addToCompare, removeFromCompare, clearAll, isInCompare,
    openPanel:   () => setPanelOpen(true),
    closePanel:  () => setPanelOpen(false),
    toggleTray:  () => setTrayExpanded((v) => !v),
  }), [items, panelOpen, trayExpanded, addToCompare, removeFromCompare, clearAll, isInCompare]);

  return (
    <ComparatorContext.Provider value={value}>
      {children}
    </ComparatorContext.Provider>
  );
}

export function useComparator() {
  const ctx = useContext(ComparatorContext);
  if (!ctx) throw new Error("useComparator must be used inside PieceComparatorProvider");
  return ctx;
}

/* ─── Styles (injected once) ────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

/* ── Tray ── */
.cmp-tray {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  font-family: 'DM Sans', sans-serif;
  pointer-events: none;
}
.cmp-tray-inner {
  pointer-events: all;
  background: #1a0f06;
  border: 1px solid rgba(212,145,74,0.35);
  border-radius: 20px;
  box-shadow: 0 16px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05);
  overflow: hidden;
  min-width: 320px;
  max-width: 540px;
  transition: all 0.3s cubic-bezier(.22,.68,0,1.2);
}

.cmp-tray-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  cursor: pointer;
  user-select: none;
}
.cmp-tray-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase; color: #d4914a;
}
.cmp-tray-count {
  background: #d4914a; color: #1a0f06;
  font-size: 10px; font-weight: 800;
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

.cmp-tray-body {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
}
.cmp-tray-body.collapsed {
  max-height: 0; padding-top: 0; padding-bottom: 0; opacity: 0;
}

.cmp-tray-slot {
  flex: 1; min-width: 0;
  background: rgba(255,255,255,0.05);
  border: 1.5px dashed rgba(212,145,74,0.25);
  border-radius: 12px;
  height: 64px;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  transition: border-color 0.2s;
}
.cmp-tray-slot.filled {
  border-style: solid;
  border-color: rgba(212,145,74,0.5);
  background: rgba(212,145,74,0.08);
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
}
.cmp-slot-name {
  font-size: 11px; font-weight: 600; color: #f5ede0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 90%; text-align: center;
}
.cmp-slot-sub {
  font-size: 10px; color: rgba(245,237,224,0.45);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 90%; text-align: center;
}
.cmp-slot-remove {
  position: absolute; top: 4px; right: 4px;
  background: rgba(255,255,255,0.1); border: none; cursor: pointer;
  border-radius: 50%; width: 16px; height: 16px;
  display: flex; align-items: center; justify-content: center;
  color: rgba(245,237,224,0.5);
  transition: background 0.15s, color 0.15s;
}
.cmp-slot-remove:hover { background: rgba(212,74,74,0.5); color: #fff; }
.cmp-slot-empty-icon { color: rgba(212,145,74,0.3); }

.cmp-tray-actions {
  display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;
}
.btn-cmp-compare {
  background: #d4914a; color: #1a0f06;
  border: none; border-radius: 10px; cursor: pointer;
  font-size: 12px; font-weight: 700; padding: 8px 14px;
  display: flex; align-items: center; gap: 5px;
  white-space: nowrap;
  font-family: 'DM Sans', sans-serif;
  transition: background 0.2s, transform 0.15s;
}
.btn-cmp-compare:hover:not(:disabled) { background: #e8a55e; transform: scale(1.03); }
.btn-cmp-compare:disabled { background: rgba(212,145,74,0.3); color: rgba(245,237,224,0.3); cursor: not-allowed; }
.btn-cmp-clear {
  background: transparent; color: rgba(245,237,224,0.35);
  border: none; cursor: pointer; font-size: 11px;
  font-family: 'DM Sans', sans-serif;
  text-decoration: underline;
  transition: color 0.2s;
}
.btn-cmp-clear:hover { color: rgba(245,237,224,0.7); }

/* ── Panel backdrop ── */
.cmp-backdrop {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(10,5,2,0.85);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  animation: cmpFadeIn 0.25s ease;
}
@keyframes cmpFadeIn { from { opacity: 0 } to { opacity: 1 } }

/* ── Panel ── */
.cmp-panel {
  background: #faf7f2;
  border-radius: 28px;
  width: 100%; max-width: 960px;
  max-height: 90vh;
  overflow-y: auto;
  animation: cmpSlideUp 0.3s cubic-bezier(.22,.68,0,1.15);
  font-family: 'DM Sans', sans-serif;
  position: relative;
}
@keyframes cmpSlideUp { from { opacity:0; transform: translateY(40px) scale(0.97) } to { opacity:1; transform: none } }

.cmp-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24px 32px 20px;
  border-bottom: 1px solid #ede3d6;
  position: sticky; top: 0;
  background: #faf7f2;
  z-index: 10;
  border-radius: 28px 28px 0 0;
}
.cmp-panel-title {
  font-family: 'Playfair Display', serif;
  font-size: 26px; font-weight: 900; color: #1a0f06;
  letter-spacing: -0.5px;
}
.cmp-panel-title span { color: #c47830; }
.btn-cmp-close {
  background: #1a0f06; color: #f5ede0;
  border: none; border-radius: 50%; cursor: pointer;
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, transform 0.15s;
}
.btn-cmp-close:hover { background: #c47830; transform: rotate(90deg); }

/* ── Product columns ── */
.cmp-cols {
  display: grid;
  padding: 28px 28px 0;
  gap: 16px;
}
.cmp-col-card {
  background: #fff;
  border: 1.5px solid #ede3d6;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.cmp-col-card.winner {
  border-color: #c47830;
  box-shadow: 0 0 0 3px rgba(196,120,48,0.12);
}
.cmp-col-visual {
  height: 110px;
  display: flex; align-items: center; justify-content: center;
  font-size: 52px;
  position: relative;
}
.cmp-winner-badge {
  position: absolute; top: 8px; left: 8px;
  background: #c47830; color: #fff;
  font-size: 9px; font-weight: 800; letter-spacing: 1.5px;
  text-transform: uppercase; padding: 3px 8px; border-radius: 100px;
}
.cmp-col-remove {
  position: absolute; top: 8px; right: 8px;
  background: rgba(26,15,6,0.55); border: none; cursor: pointer;
  border-radius: 50%; width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  color: rgba(245,237,224,0.6);
  transition: background 0.15s;
}
.cmp-col-remove:hover { background: rgba(200,40,40,0.7); color: #fff; }
.cmp-col-name {
  font-family: 'Playfair Display', serif;
  font-size: 18px; font-weight: 700; color: #1a0f06;
  padding: 12px 14px 2px;
}
.cmp-col-sub {
  font-size: 11px; color: #b09060;
  padding: 0 14px 14px;
}
.cmp-col-add {
  width: calc(100% - 28px); margin: 0 14px 14px;
  padding: 9px; border-radius: 10px;
  background: #1a0f06; color: #f5ede0;
  border: none; cursor: pointer; font-size: 12px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'DM Sans', sans-serif;
  transition: background 0.2s;
}
.cmp-col-add:hover:not(:disabled) { background: #c47830; }
.cmp-col-add:disabled { background: #d0c5b5; color: #a09080; cursor: not-allowed; }

/* ── Rows ── */
.cmp-table { padding: 0 28px 32px; }
.cmp-section-title {
  font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase;
  color: #9a6a3a; font-weight: 600;
  padding: 20px 0 10px;
  border-top: 1px solid #ede3d6;
  margin-top: 4px;
}
.cmp-row {
  display: grid;
  gap: 16px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0e6d6;
}
.cmp-row-label {
  font-size: 11px; color: #b09060; font-weight: 500;
  display: flex; align-items: center; gap: 6px;
}
.cmp-cell {
  font-size: 14px; font-weight: 600; color: #1a0f06;
  text-align: center;
}
.cmp-cell.best {
  color: #1a7a3a;
}
.cmp-cell.worst {
  color: #a02020;
}
.cmp-cell.neutral {
  color: #9a6800;
}
.pill-sm {
  display: inline-block;
  background: #f5ede0; color: #7a5030;
  font-size: 10px; padding: 3px 8px; border-radius: 6px;
  font-weight: 500;
}

/* ── Insights bar ── */
.cmp-insights {
  margin: 0 28px 28px;
  background: #1a0f06;
  border-radius: 18px;
  padding: 20px 24px;
  display: grid;
  gap: 12px;
}
.insight-item {
  display: flex; align-items: flex-start; gap: 12px;
}
.insight-icon {
  flex-shrink: 0;
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(212,145,74,0.15);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
}
.insight-text {
  font-size: 12px; color: rgba(245,237,224,0.65); line-height: 1.5;
}
.insight-text strong { color: #d4914a; font-weight: 600; }

/* ── Placeholder slot ── */
.cmp-placeholder-col {
  background: rgba(0,0,0,0.02);
  border: 2px dashed #ede3d6;
  border-radius: 20px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px;
  min-height: 220px;
  color: #c8b8a0;
  font-size: 13px;
}
.cmp-placeholder-col .icon { font-size: 32px; opacity: 0.35; }

/* ── Scroll bar ── */
.cmp-panel::-webkit-scrollbar { width: 6px; }
.cmp-panel::-webkit-scrollbar-track { background: transparent; }
.cmp-panel::-webkit-scrollbar-thumb { background: #d0c0a8; border-radius: 3px; }
`;

function StyleInjector() {
  if (typeof document === "undefined") return null;
  const id = "cmp-styles";
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = STYLES;
    document.head.appendChild(el);
  }
  return null;
}

/* ─── helpers ───────────────────────────────────────────────────────────────── */
/** Returns index of item with lowest price (ignoring zeros) */
function bestIdx(items, key, higher = false) {
  const vals = items.map((it) => Number(it[key] ?? 0));
  const nonZero = vals.filter((v) => v > 0);
  if (nonZero.length < 2) return -1;
  const target = higher ? Math.max(...nonZero) : Math.min(...nonZero);
  return vals.indexOf(target);
}

function pricePerM3(item) {
  const vol = Number(item.m3 ?? 0);
  const price = Number(item.price ?? 0);
  if (!vol || !price) return 0;
  return price / vol;
}

function cellClass(items, idx, key, lowerIsBetter = true) {
  const vals = items.map((it) => Number(it[key] ?? 0)).filter((v) => v > 0);
  if (vals.length < 2) return "";
  const val = Number(items[idx]?.[key] ?? 0);
  if (!val) return "";
  const best = lowerIsBetter ? Math.min(...vals) : Math.max(...vals);
  const worst = lowerIsBetter ? Math.max(...vals) : Math.min(...vals);
  if (val === best) return "best";
  if (val === worst) return "worst";
  return "neutral";
}

/* ─── Comparison Panel ──────────────────────────────────────────────────────── */
function ComparisonPanel({ items, onClose, onRemove, onAddToCart }) {
  const count = items.length;
  // grid columns: label col + one per item + placeholder(s)
  const totalCols = MAX_ITEMS + 1; // label + 3 data cols always shown

  const gridStyle = {
    gridTemplateColumns: `140px repeat(${MAX_ITEMS}, 1fr)`,
  };

  const cheapestPpM3Idx = useMemo(() => {
    const vals = items.map(pricePerM3);
    const nonZero = vals.filter((v) => v > 0);
    if (nonZero.length < 2) return -1;
    const min = Math.min(...nonZero);
    return vals.indexOf(min);
  }, [items]);

  // Insights
  const insights = useMemo(() => {
    const out = [];
    if (items.length < 2) return out;

    // Best price/m3
    if (cheapestPpM3Idx >= 0) {
      const it = items[cheapestPpM3Idx];
      out.push({
        icon: "💡",
        text: (
          <>
            <strong>{it.woodName}</strong> ofrece el mejor precio por m³ ({fmt(pricePerM3(it))}/m³), ideal si tu proyecto requiere volumen.
          </>
        ),
      });
    }
    // Highest stock
    const maxStockIdx = bestIdx(items, "quantity", true);
    if (maxStockIdx >= 0) {
      const it = items[maxStockIdx];
      out.push({
        icon: "📦",
        text: (
          <>
            Mayor disponibilidad: <strong>{it.woodName}</strong> con {it.quantity} piezas en stock, menor riesgo de desabasto.
          </>
        ),
      });
    }
    // Cubicable
    const cubicable = items.filter((i) => i.allowsCubic);
    if (cubicable.length > 0 && cubicable.length < items.length) {
      out.push({
        icon: "📐",
        text: (
          <>
            Solo <strong>{cubicable.map((i) => i.woodName).join(", ")}</strong> admite cubicación automática — conveniente para pedidos grandes.
          </>
        ),
      });
    }
    return out;
  }, [items, cheapestPpM3Idx]);

  return (
    <div className="cmp-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cmp-panel">
        {/* Header */}
        <div className="cmp-panel-header">
          <div>
            <div className="cmp-panel-title">
              Comparar <span>Piezas</span>
            </div>
            <div style={{ fontSize: 12, color: "#b09060", marginTop: 2 }}>
              {count} producto{count !== 1 ? "s" : ""} seleccionado{count !== 1 ? "s" : ""}
            </div>
          </div>
          <button className="btn-cmp-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Product cards row */}
        <div
          className="cmp-cols"
          style={{ gridTemplateColumns: `repeat(${MAX_ITEMS}, 1fr)` }}
        >
          {Array.from({ length: MAX_ITEMS }).map((_, i) => {
            const item = items[i];
            if (!item) {
              return (
                <div key={`empty-${i}`} className="cmp-placeholder-col">
                  <div className="icon">🪵</div>
                  <div>Agrega una pieza<br />para comparar</div>
                </div>
              );
            }
            const isWinner = i === cheapestPpM3Idx && items.length > 1;
            return (
              <div key={item.id} className={`cmp-col-card${isWinner ? " winner" : ""}`}>
                <div
                  className="cmp-col-visual"
                  style={{ background: `linear-gradient(135deg, #c8a97e, #8a5a30)` }}
                >
                  {isWinner && <span className="cmp-winner-badge">Mejor precio/m³</span>}
                  <button className="cmp-col-remove" onClick={() => onRemove(item.id)}>
                    <X size={12} />
                  </button>
                  <span style={{ fontSize: 48, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.3))" }}>
                    {item.emoji || "🪵"}
                  </span>
                </div>
                <div className="cmp-col-name">{item.woodName}</div>
                <div className="cmp-col-sub">{item.categoryLabel} · {item.measureLabel || "—"}</div>
                <button
                  className="cmp-col-add"
                  disabled={item.quantity === 0}
                  onClick={() => onAddToCart(item)}
                >
                  <ShoppingCart size={13} />
                  {item.quantity === 0 ? "Agotado" : "Agregar al carrito"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="cmp-table">
          {/* ── Precio ── */}
          <div className="cmp-section-title">Precio</div>

          <div className="cmp-row" style={{ ...gridStyle }}>
            <div className="cmp-row-label">💰 Precio por pieza</div>
            {Array.from({ length: MAX_ITEMS }).map((_, i) => {
              const item = items[i];
              if (!item) return <div key={i} className="cmp-cell" style={{ color: "#ddd" }}>—</div>;
              const cls = cellClass(items, i, "price");
              return (
                <div key={item.id} className={`cmp-cell ${cls}`}>
                  {fmt(item.price)}
                </div>
              );
            })}
          </div>

          <div className="cmp-row" style={{ ...gridStyle }}>
            <div className="cmp-row-label">📊 Precio por m³</div>
            {Array.from({ length: MAX_ITEMS }).map((_, i) => {
              const item = items[i];
              if (!item) return <div key={i} className="cmp-cell" style={{ color: "#ddd" }}>—</div>;
              const ppM3 = pricePerM3(item);
              const cls = ppM3 > 0 ? cellClass(
                items.map((it) => ({ ...it, ppM3: pricePerM3(it) })), i, "ppM3"
              ) : "";
              return (
                <div key={item.id} className={`cmp-cell ${cls}`}>
                  {ppM3 > 0 ? fmt(ppM3) : "—"}
                </div>
              );
            })}
          </div>

          {/* ── Dimensiones ── */}
          <div className="cmp-section-title">Dimensiones</div>

          <div className="cmp-row" style={{ ...gridStyle }}>
            <div className="cmp-row-label">📐 Sección</div>
            {Array.from({ length: MAX_ITEMS }).map((_, i) => {
              const item = items[i];
              if (!item) return <div key={i} className="cmp-cell" style={{ color: "#ddd" }}>—</div>;
              return (
                <div key={item.id} className="cmp-cell">
                  {item.ancho > 0 && item.alto > 0
                    ? <span className="pill-sm">{item.ancho.toFixed(1)}" × {item.alto.toFixed(1)}"</span>
                    : item.measureLabel || "—"}
                </div>
              );
            })}
          </div>

          <div className="cmp-row" style={{ ...gridStyle }}>
            <div className="cmp-row-label">📏 Largo</div>
            {Array.from({ length: MAX_ITEMS }).map((_, i) => {
              const item = items[i];
              if (!item) return <div key={i} className="cmp-cell" style={{ color: "#ddd" }}>—</div>;
              const cls = cellClass(items, i, "largo", false);
              return (
                <div key={item.id} className={`cmp-cell ${cls}`}>
                  {item.largo > 0 ? `${item.largo.toFixed(2)} m` : "—"}
                </div>
              );
            })}
          </div>

          <div className="cmp-row" style={{ ...gridStyle }}>
            <div className="cmp-row-label">🧊 Volumen</div>
            {Array.from({ length: MAX_ITEMS }).map((_, i) => {
              const item = items[i];
              if (!item) return <div key={i} className="cmp-cell" style={{ color: "#ddd" }}>—</div>;
              const cls = cellClass(items, i, "m3", false);
              return (
                <div key={item.id} className={`cmp-cell ${cls}`}>
                  {item.m3 > 0 ? `${Number(item.m3).toFixed(4)} m³` : "—"}
                </div>
              );
            })}
          </div>

          {/* ── Inventario ── */}
          <div className="cmp-section-title">Inventario</div>

          <div className="cmp-row" style={{ ...gridStyle }}>
            <div className="cmp-row-label">📦 Disponibles</div>
            {Array.from({ length: MAX_ITEMS }).map((_, i) => {
              const item = items[i];
              if (!item) return <div key={i} className="cmp-cell" style={{ color: "#ddd" }}>—</div>;
              const cls = cellClass(items, i, "quantity", false);
              return (
                <div key={item.id} className={`cmp-cell ${cls}`}>
                  {item.quantity > 0 ? `${item.quantity} pzas` : <span style={{ color: "#a02020", fontSize: 12 }}>Agotado</span>}
                </div>
              );
            })}
          </div>

          <div className="cmp-row" style={{ ...gridStyle }}>
            <div className="cmp-row-label">✓ Cubicable</div>
            {Array.from({ length: MAX_ITEMS }).map((_, i) => {
              const item = items[i];
              if (!item) return <div key={i} className="cmp-cell" style={{ color: "#ddd" }}>—</div>;
              return (
                <div key={item.id} className="cmp-cell">
                  {item.allowsCubic
                    ? <span style={{ color: "#1a7a3a", fontWeight: 700 }}>✓ Sí</span>
                    : <span style={{ color: "#b0a090" }}>No</span>}
                </div>
              );
            })}
          </div>

          <div className="cmp-row" style={{ ...gridStyle }}>
            <div className="cmp-row-label">💲 Cobro por</div>
            {Array.from({ length: MAX_ITEMS }).map((_, i) => {
              const item = items[i];
              if (!item) return <div key={i} className="cmp-cell" style={{ color: "#ddd" }}>—</div>;
              return (
                <div key={item.id} className="cmp-cell">
                  <span className="pill-sm">
                    {item.pricingStrategy ? item.pricingStrategy.replace(/_/g, " ") : "unidad"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="cmp-insights">
            {insights.map((ins, i) => (
              <div key={i} className="insight-item">
                <div className="insight-icon">{ins.icon}</div>
                <div className="insight-text">{ins.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Tray (always visible when ≥1 item) ────────────────────────────────────── */
export function ComparatorTray({ addToCartFn }) {
  const {
    items, panelOpen, trayExpanded,
    removeFromCompare, clearAll,
    openPanel, closePanel, toggleTray,
  } = useComparator();

  const handleAddToCart = useCallback(
    (item) => { if (addToCartFn) addToCartFn(item); },
    [addToCartFn]
  );

  if (items.length === 0) return <StyleInjector />;

  return (
    <>
      <StyleInjector />

      {/* ── Floating tray ── */}
      <div className="cmp-tray">
        <div className="cmp-tray-inner">
          <div className="cmp-tray-header" onClick={toggleTray}>
            <div className="cmp-tray-label">
              <Scale size={14} />
              Comparador
              <span className="cmp-tray-count">{items.length}</span>
            </div>
            <div style={{ color: "rgba(245,237,224,0.4)", display: "flex", alignItems: "center" }}>
              {trayExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </div>
          </div>

          <div className={`cmp-tray-body${trayExpanded ? "" : " collapsed"}`}>
            {Array.from({ length: MAX_ITEMS }).map((_, i) => {
              const item = items[i];
              if (!item) {
                return (
                  <div key={`s-${i}`} className="cmp-tray-slot">
                    <Plus size={16} className="cmp-slot-empty-icon" />
                  </div>
                );
              }
              return (
                <div key={item.id} className="cmp-tray-slot filled">
                  <button className="cmp-slot-remove" onClick={(e) => { e.stopPropagation(); removeFromCompare(item.id); }}>
                    <X size={9} />
                  </button>
                  <span style={{ fontSize: 22 }}>{item.emoji || "🪵"}</span>
                  <div className="cmp-slot-name">{item.woodName}</div>
                  <div className="cmp-slot-sub">{item.measureLabel || item.categoryLabel}</div>
                </div>
              );
            })}
            <div className="cmp-tray-actions">
              <button className="btn-cmp-compare" disabled={items.length < 2} onClick={openPanel}>
                <Scale size={13} /> Comparar <ArrowRight size={12} />
              </button>
              <button className="btn-cmp-clear" onClick={clearAll}>Limpiar</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Full panel ── */}
      {panelOpen && (
        <ComparisonPanel
          items={items}
          onClose={closePanel}
          onRemove={removeFromCompare}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
}

/* ─── Add-to-compare button (drop into each product card) ───────────────────
 *
 *  <CompareButton item={item} />
 *
 *  Paste this inside the card's action row alongside the "Agregar al carrito" button.
 */
export function CompareButton({ item }) {
  const { addToCompare, removeFromCompare, isInCompare, items } = useComparator();
  const inCompare = isInCompare(item.id);
  const full = items.length >= MAX_ITEMS && !inCompare;

  return (
    <button
      type="button"
      title={inCompare ? "Quitar de comparador" : full ? "Comparador lleno (máx 3)" : "Agregar al comparador"}
      onClick={() => inCompare ? removeFromCompare(item.id) : addToCompare(item)}
      disabled={full}
      style={{
        width: 38, height: 38, borderRadius: 10,
        border: `1.5px solid ${inCompare ? "#c47830" : "#ede3d6"}`,
        background: inCompare ? "rgba(196,120,48,0.1)" : "#faf7f2",
        cursor: full ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: inCompare ? "#c47830" : full ? "#ccc" : "#9a7050",
        transition: "all 0.2s",
        flexShrink: 0,
      }}
    >
      {inCompare ? <Minus size={15} /> : <Scale size={15} />}
    </button>
  );
}