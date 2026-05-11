import { Trash2, ShoppingCart, ArrowRight, FileText } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export default function Cart() {
  const { user, setPage, notify, setQuotationItems, cart, removeFromCart, updateCartQty, clearCart, getCartTotal, getCartItemCount } = useApp();

  const subtotal = getCartTotal();
  const transport = subtotal > 0 ? 85000 : 0;
  const total = subtotal + transport;

  const handleGenerateQuotation = () => {
    const itemsForQuotation = cart.map(item => ({
      id: item.pieceId,
      cartItemId: item.id,
      woodTypeId: item.pieceId,
      woodName: item.woodName,
      largo: item.largo_m,
      ancho: item.ancho_m,
      alto: item.alto_m,
      qty: item.qty,
      precio_unitario: item.price,
      subtotal: item.total_price,
      volumen_m3: item.volumen_m3,
      stock: item.stock,
    }));

    setQuotationItems(itemsForQuotation);
    setPage("quotation");
    notify(`${cart.length} productos enviados a cotización`, "success");
  };

  const handleClearCart = () => {
    if (confirm("¿Estás seguro de que deseas vaciar el carrito?")) {
      clearCart();
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16">
        <div className="text-center py-16 bg-surface border border-border rounded-2xl">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="font-display font-bold text-2xl text-text mb-2">
            Carrito vacío
          </h3>
          <p className="text-text-muted mb-6">
            Aún no has agregado productos a tu carrito.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setPage("catalog")}
          >
            <ShoppingCart size={16} /> Explorar Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display font-black text-3xl md:text-4xl text-primary">
          Tu <span className="text-accent">Carrito</span>
        </h1>
        <button
          type="button"
          className="btn btn-ghost btn-sm text-danger hover:text-danger"
          onClick={handleClearCart}
        >
          <Trash2 size={16} /> Vaciar todo
        </button>
      </div>

      {!user && (
        <div className="bg-warning/10 border border-warning/20 rounded-md px-4 py-3 mb-5 text-sm text-text-muted">
          ℹ️{" "}
          <button
            type="button"
            className="text-primary font-semibold hover:underline cursor-pointer"
            onClick={() => setPage("login")}
          >
            Inicia sesión
          </button>{" "}
          para guardar tu carrito y acceder a pagos en línea.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de productos */}
        <div className="lg:col-span-2 space-y-3">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-border rounded-xl p-4 transition hover:shadow-sm"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-bg-soft to-surface rounded-lg flex items-center justify-center text-3xl">
                  {item.emoji || "🪵"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-text mb-1">
                    {item.woodName || "Madera"}
                  </div>
                  <div className="text-xs text-text-muted space-y-0.5">
                    {item.largo_m > 0 && item.ancho_m > 0 && item.alto_m > 0 && (
                      <div>
                        📏 {item.largo_m.toFixed(2)}m × {item.ancho_m.toFixed(2)}m × {item.alto_m.toFixed(2)}m
                      </div>
                    )}
                    {item.volumen_m3 > 0 && (
                      <div>📦 Volumen: {item.volumen_m3.toFixed(4)}m³</div>
                    )}
                    <div>💰 {fmt(item.price)} c/u</div>
                    {item.stock !== undefined && (
                      <div className={`text-xs ${item.stock < 10 ? "text-danger" : "text-text-subtle"}`}>
                        Stock: {item.stock} unidades
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 bg-surface-2 rounded-md p-1">
                    <button
                      type="button"
                      className="w-8 h-8 rounded-md bg-white border border-border text-text font-bold hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                      onClick={() => updateCartQty(item.id, item.qty - 1)}
                      disabled={item.qty <= 1}
                    >
                      −
                    </button>
                    <span className="min-w-[32px] text-center text-sm font-semibold">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-md bg-white border border-border text-text font-bold hover:border-primary hover:text-primary transition-colors"
                      onClick={() => updateCartQty(item.id, item.qty + 1)}
                      disabled={item.qty >= item.stock} 
                    >
                      +
                    </button>
                  </div>
                  <div className="font-bold text-primary text-base">
                    {fmt(item.total_price)}
                  </div>
                  <button
                    type="button"
                    className="text-danger hover:text-danger/80 transition-colors"
                    onClick={() => removeFromCart(item.id)}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen del pedido */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-2xl p-6 sticky top-24">
            <h3 className="font-display font-bold text-lg text-text mb-4">
              Resumen del pedido
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-text-muted">
                  Subtotal ({getCartItemCount()} piezas)
                </span>
                <span className="font-semibold">{fmt(subtotal)}</span>
              </div>

              <div className="flex justify-between py-2 border-t border-border">
                <span className="text-text-muted">Transporte estimado</span>
                <span>{fmt(transport)}</span>
              </div>

              <div className="flex justify-between py-2 text-xs text-text-subtle">
                <span>🚛 Salvoconducto (según m³)</span>
                <span>Se calculará en cotización</span>
              </div>

              <div className="flex justify-between items-baseline pt-4 mt-2 border-t border-border-strong">
                <span className="font-display font-bold text-lg text-text">
                  Total estimado
                </span>
                <span className="font-display font-black text-2xl text-primary">
                  {fmt(total)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={handleGenerateQuotation}
              >
                <FileText size={16} /> Generar Cotización
              </button>

              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => {
                  if (!user) {
                    notify("Inicia sesión para continuar con el pago", "error");
                    setPage("login");
                    return;
                  }
                  notify("Redirigiendo a plataforma de pagos...", "success");
                }}
              >
                <ArrowRight size={16} /> Proceder al Pago
              </button>

              <button
                type="button"
                className="btn btn-ghost w-full"
                onClick={() => setPage("catalog")}
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}