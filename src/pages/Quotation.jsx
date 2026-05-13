import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { quotationsAPI } from "@/services/quotations";
import { quotationDetailsAPI } from "@/services/quotation_details";

const fmtNumber = (value, digits = 2) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "0";
  return numeric.toFixed(digits);
};

function buildQuotationPayload({ form }, strict = false) {
  const tipo_compra = form.tipo_compra?.trim();
  const user_id = form.user_id;
  if (!tipo_compra) {
    if (strict) throw new Error("Selecciona el tipo de compra.");
    return null;
  }

  return {
    user_id,
    tipo_compra,
  };
}

export default function Quotation() {
  const { user, cart, notify, setPage } = useApp();
  const [cotizationInfo, setCotizationInfo] = useState({});
  const [quotationDetails, setQuotationDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [lastSubmittedTipoCompra, setLastSubmittedTipoCompra] = useState("");
  const [hasQuoted, setHasQuoted] = useState(false);
  const [form, setForm] = useState({
    user_id: user.user_id,
    tipo_compra: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessError, setAccessError] = useState("");
  const canQuote = Boolean(
    user && ["admin", "staff", "user"].includes(user.role),
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!user) {
        setLoading(false);
        return;
      }

      if (!canQuote) {
        setAccessError(
          "Tu usuario no tiene acceso al módulo de cotizaciones del backend actual.",
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setAccessError("");

      if (active) setLoading(false);
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [canQuote, user]);

  const saveQuotation = async () => {
    try {
      const payload = buildQuotationPayload({ form }, true);
      setSaving(true);
      setDetailsError("");
      setQuotationDetails([]);
      const created = await quotationsAPI.create(payload);
      setCotizationInfo(created);
      const targetCotizationId = created?.id;
      if (targetCotizationId) {
        setDetailsLoading(true);
        try {
          const details =
            await quotationDetailsAPI.listByCotization(targetCotizationId);
          setQuotationDetails(Array.isArray(details) ? details : []);
        } catch (detailError) {
          setDetailsError(
            detailError.message || "No se pudieron cargar los detalles.",
          );
        } finally {
          setDetailsLoading(false);
        }
      }
      notify(`Cotización #${created.id} creada correctamente`, "success");
      setHasQuoted(true);
      setLastSubmittedTipoCompra(form.tipo_compra?.trim() || "");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setHasQuoted(false);
    setLastSubmittedTipoCompra("");
    setCotizationInfo({});
    setQuotationDetails([]);
    setDetailsError("");
    setPage(user?.role === "admin" ? "admin" : "catalog");
  };

  const isSubmitDisabled =
    saving ||
    !form.tipo_compra?.trim() ||
    (hasQuoted && form.tipo_compra?.trim() === lastSubmittedTipoCompra);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16">
        <div className="bg-white border border-border rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="font-display font-black text-3xl text-primary mb-3">
            Inicia sesión para cotizar
          </h1>
          <p className="text-text-muted mb-6">
            El nuevo flujo de cotización del backend requiere autenticación para
            guardar la cotización.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setPage("login")}
            >
              Ir a iniciar sesión
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPage("catalog")}
            >
              Volver al catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-16">
        <div className="bg-white border border-border rounded-2xl p-8 text-text-subtle">
          Cargando módulo de cotizaciones...
        </div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16">
        <div className="bg-white border border-border rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">📄</div>
          <h1 className="font-display font-black text-3xl text-primary mb-3">
            No se pudo abrir cotizaciones
          </h1>
          <p className="text-text-muted mb-6">{accessError}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setPage("catalog")}
            >
              Volver al catálogo
            </button>
            {user?.role === "admin" && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPage("admin")}
              >
                Ir al panel administrativo
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-[4px] text-accent font-semibold mb-2">
            Cotizaciones ANGWOOD
          </div>
          <h1 className="font-display font-black text-3xl md:text-4xl text-primary">
            Nueva <span className="text-accent">Cotización</span>
          </h1>
          <p className="text-sm text-text-muted mt-2 max-w-2xl">
            Selecciona el tipo de compra y guarda la cotizacion para generar el
            detalle directamente desde el backend.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setPage("catalog")}
        >
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      {cart.length > 0 && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 text-sm text-text mb-6">
          Se tomaron <strong>{cart.length}</strong> productos del carrito como
          base para esta cotización. Puedes continuar con el tipo de compra.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6">
            <div className="font-display font-bold text-lg text-text mb-4">
              Tipo de compra
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Selecciona el tipo de compra</label>
              <select
                className="form-input"
                value={form.tipo_compra}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    tipo_compra: e.target.value,
                  }))
                }
              >
                <option value="">Selecciona</option>
                <option value="por_pedido">por_pedido</option>
                <option value="por_pulgadas">por_pulgadas</option>
              </select>
            </div>
          </div>

          {cotizationInfo?.id && (
            <div className="bg-white border border-border rounded-2xl p-6">
              <div className="font-display font-bold text-lg text-text mb-4">
                Informacion de la cotizacion
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Id
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {cotizationInfo.id}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Numero de cotizacion
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {cotizationInfo.numero_cotizacion || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Estado
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {cotizationInfo.estado || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Tipo de compra
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {cotizationInfo.tipo_compra || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Total m3
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtNumber(cotizationInfo.total_m3, 4)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Subtotal
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtNumber(cotizationInfo.subtotal, 2)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Costo transporte
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtNumber(cotizationInfo.costo_transporte, 2)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Costo cargue
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtNumber(cotizationInfo.costo_cargue, 2)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Costo descargue
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtNumber(cotizationInfo.costo_descargue, 2)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Costo salvoconducto
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtNumber(cotizationInfo.costo_salvoconducto, 2)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Porcentaje anticipo
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtNumber(cotizationInfo.porcentaje_anticipo, 2)}%
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Valor anticipo
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtNumber(cotizationInfo.valor_anticipo, 2)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Total monto
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtNumber(cotizationInfo.total_monto, 2)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Fecha emision
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {cotizationInfo.fecha_emision || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Fecha vencimiento
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {cotizationInfo.fecha_vencimiento || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Salvoconducto manual
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {cotizationInfo.salvoconducto_es_manual ? "Si" : "No"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Creado
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {cotizationInfo.created_at || "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {cotizationInfo?.id && (
            <div className="bg-white border border-border rounded-2xl p-6">
              <div className="font-display font-bold text-lg text-text mb-4">
                Detalles de cotizacion
              </div>

              {detailsLoading ? (
                <div className="text-sm text-text-subtle">
                  Cargando detalles de la cotizacion...
                </div>
              ) : detailsError ? (
                <div className="text-sm text-error">{detailsError}</div>
              ) : quotationDetails.length === 0 ? (
                <div className="text-sm text-text-subtle">
                  No hay detalles cargados para esta cotizacion.
                </div>
              ) : (
                <div className="space-y-3">
                  {quotationDetails.map((detail) => (
                    <div
                      key={detail.id}
                      className="rounded-xl border border-border bg-surface-2 p-4"
                    >
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-text">
                            {detail.descripcion_item || "Detalle"}
                          </div>
                          <div className="text-xs text-text-muted mt-1">
                            Pieza #{detail.pieza_id}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-primary">
                          {fmtNumber(detail.subtotal, 2)}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-text-muted">
                        <div>
                          <div className="uppercase tracking-[1px]">
                            Cantidad
                          </div>
                          <div className="text-sm text-text mt-1">
                            {detail.cantidad}
                          </div>
                        </div>
                        <div>
                          <div className="uppercase tracking-[1px]">
                            Volumen m3
                          </div>
                          <div className="text-sm text-text mt-1">
                            {fmtNumber(detail.volumen_unitario_m3, 4)}
                          </div>
                        </div>
                        <div>
                          <div className="uppercase tracking-[1px]">
                            Precio unitario
                          </div>
                          <div className="text-sm text-text mt-1">
                            {fmtNumber(detail.precio_unitario_snapshot, 2)}
                          </div>
                        </div>
                        <div>
                          <div className="uppercase tracking-[1px]">
                            Subtotal
                          </div>
                          <div className="text-sm text-text mt-1">
                            {fmtNumber(detail.subtotal, 2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="xl:col-span-1">
          <div className="bg-white border border-border rounded-2xl p-6 sticky top-24">
            <div className="flex flex-col gap-3 mt-6">
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={saveQuotation}
                disabled={isSubmitDisabled}
              >
                <Save size={16} />{" "}
                {saving ? "Guardando..." : "Hacer cotización"}
              </button>

              <button
                type="button"
                className="btn btn-ghost w-full"
                onClick={handleCancel}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
