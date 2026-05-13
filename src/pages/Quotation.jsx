import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Plus, Save, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { clientsAPI } from "@/services/clients";
import { inventoryAPI } from "@/services/inventory";
import { quotationsAPI } from "@/services/quotations";

const fmtCurrency = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const fmtNumber = (value, digits = 2) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "0";
  return numeric.toFixed(digits);
};

const buildDetailId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const parseOptionalNumber = (value) => {
  if (value === "" || value == null) return undefined;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? undefined : numeric;
};

const measureLabel = (measure) => {
  if (!measure) return "Sin medida";
  return (
    measure.etiqueta ||
    `${measure.ancho_in || "—"}" x ${measure.alto_in || "—"}"`
  );
};

const emptyDetail = (woodTypes, measures) => ({
  id: buildDetailId(),
  tipo_madera_id: woodTypes[0]?.id ? String(woodTypes[0].id) : "",
  medida_id: measures[0]?.id ? String(measures[0].id) : "",
  wood_piece_id: "",
  largo_m: "",
  cantidad: "1",
  notas: "",
});

const detailFromCartItem = (item, woodTypes, measures) => ({
  id: buildDetailId(),
  tipo_madera_id: item.tipo_madera_id
    ? String(item.tipo_madera_id)
    : woodTypes[0]?.id
      ? String(woodTypes[0].id)
      : "",
  medida_id: item.medida_id
    ? String(item.medida_id)
    : measures[0]?.id
      ? String(measures[0].id)
      : "",
  wood_piece_id: item.pieceId ? String(item.pieceId) : "",
  largo_m: item.largo_m ? String(item.largo_m) : "",
  cantidad: item.qty ? String(item.qty) : "1",
  notas: "",
});

function buildQuotationPayload({ clientId, details, form }, strict = false) {
  if (!clientId) {
    if (strict) throw new Error("Selecciona un cliente.");
    return null;
  }

  const parsedDetails = details.map((detail) => {
    const tipo_madera_id = Number(detail.tipo_madera_id);
    const medida_id = Number(detail.medida_id);
    const largo_m = Number(detail.largo_m);
    const cantidad = Number(detail.cantidad || 0);

    const isInvalid =
      !tipo_madera_id ||
      !medida_id ||
      Number.isNaN(largo_m) ||
      largo_m <= 0 ||
      Number.isNaN(cantidad) ||
      cantidad <= 0;

    if (isInvalid) return null;

    return {
      tipo_madera_id,
      medida_id,
      wood_piece_id: detail.wood_piece_id ? Number(detail.wood_piece_id) : null,
      largo_m,
      cantidad,
      notas: detail.notas?.trim() || null,
    };
  });

  if (parsedDetails.some((detail) => detail == null)) {
    if (strict) {
      throw new Error(
        "Completa tipo de madera, medida, largo y cantidad en todos los detalles.",
      );
    }
    return null;
  }

  if (!parsedDetails.length) {
    if (strict) throw new Error("Agrega al menos un detalle a la cotización.");
    return null;
  }

  const payload = {
    cliente_id: Number(clientId),
    detalles: parsedDetails,
  };

  const optionalFields = [
    "costo_cargue_terrestre",
    "costo_descargue_terrestre",
    "costo_cargue_maritimo",
    "costo_descargue_maritimo",
    "precio_epa_por_metro",
    "porcentaje_anticipo",
  ];

  optionalFields.forEach((field) => {
    const parsed = parseOptionalNumber(form[field]);
    if (parsed !== undefined) {
      payload[field] = parsed;
    }
  });

  if (form.notas?.trim()) {
    payload.notas = form.notas.trim();
  }

  return payload;
}

export default function Quotation() {
  const { user, cart, notify, setPage, clearCart } = useApp();
  const [clients, setClients] = useState([]);
  const [woodTypes, setWoodTypes] = useState([]);
  const [measures, setMeasures] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [details, setDetails] = useState([]);
  const [form, setForm] = useState({
    costo_cargue_terrestre: "",
    costo_descargue_terrestre: "",
    costo_cargue_maritimo: "",
    costo_descargue_maritimo: "",
    precio_epa_por_metro: "",
    porcentaje_anticipo: "100",
    notas: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [accessError, setAccessError] = useState("");
  const canQuote = Boolean(user && ["admin", "staff"].includes(user.role));

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!user) {
        setLoading(false);
        return;
      }

      if (!canQuote) {
        setAccessError("No tienes permisos para crear cotizaciones. Contacta al administrador.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setAccessError("");

      try {
        const [clientList, woodTypeList, measureList, pieceList] =
          await Promise.all([
            clientsAPI.list(true),
            inventoryAPI.listWoodTypes(),
            inventoryAPI.listMeasures(),
            inventoryAPI.listPieces({ estado: "disponible", limit: 200 }),
          ]);

        if (!active) return;

        setClients(clientList);
        setWoodTypes(woodTypeList);
        setMeasures(measureList);
        setPieces(pieceList);
        setSelectedClientId(clientList[0]?.id ? String(clientList[0].id) : "");

        if (cart.length > 0) {
          setDetails(
            cart.map((item) => detailFromCartItem(item, woodTypeList, measureList)),
          );
        } else {
          setDetails([emptyDetail(woodTypeList, measureList)]);
        }
      } catch (err) {
        if (!active) return;
        setAccessError(
          err.message ||
            "No fue posible cargar clientes o catálogos para cotizar.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [canQuote, user]);

  useEffect(() => {
    let active = true;
    const payload = buildQuotationPayload(
      { clientId: selectedClientId, details, form },
      false,
    );

    if (!payload || !canQuote || accessError) {
      setPreview(null);
      setPreviewLoading(false);
      return undefined;
    }

    setPreviewLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const data = await quotationsAPI.preview(payload);
        if (active) setPreview(data);
      } catch (err) {
        if (active) {
          setPreview(null);
          notify(err.message, "error");
        }
      } finally {
        if (active) setPreviewLoading(false);
      }
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [accessError, canQuote, details, form, notify, selectedClientId]);

  const clientMap = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );

  const woodTypeMap = useMemo(
    () => new Map(woodTypes.map((woodType) => [woodType.id, woodType])),
    [woodTypes],
  );

  const updateDetail = (detailId, field, value) => {
    setDetails((current) =>
      current.map((detail) =>
        detail.id === detailId ? { ...detail, [field]: value } : detail,
      ),
    );
  };

  const addDetail = () => {
    setDetails((current) => [...current, emptyDetail(woodTypes, measures)]);
  };

  const removeDetail = (detailId) => {
    setDetails((current) =>
      current.length === 1
        ? current
        : current.filter((detail) => detail.id !== detailId),
    );
  };

  const saveQuotation = async () => {
    try {
      const payload = buildQuotationPayload(
        { clientId: selectedClientId, details, form },
        true,
      );
      setSaving(true);
      const created = await quotationsAPI.create(payload);
      await clearCart();
      notify(`Cotización #${created.id} creada correctamente`, "success");
      setPage(user?.role === "admin" ? "admin" : "catalog");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

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
            consultar clientes y guardar la cotización.
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
            Selecciona un cliente, arma los detalles del pedido y valida el total
            con preview en vivo antes de guardar.
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
          base para esta cotización. Puedes ajustar cada detalle antes de guardar.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6">
            <div className="font-display font-bold text-lg text-text mb-4">
              Cliente
            </div>
            {clients.length === 0 ? (
              <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text">
                No hay clientes activos disponibles. Crea uno en el panel
                administrativo para poder cotizar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Cliente</label>
                  <select
                    className="form-input"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.nombre_razon_social}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Identificación</label>
                  <input
                    className="form-input"
                    value={
                      clientMap.get(Number(selectedClientId))
                        ?.identificacion_fiscal || ""
                    }
                    disabled
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-border rounded-2xl p-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div className="font-display font-bold text-lg text-text">
                Detalles del pedido
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={addDetail}
              >
                <Plus size={14} /> Agregar detalle
              </button>
            </div>

            <div className="space-y-4">
              {details.map((detail, index) => {
                const filteredPieces = pieces.filter((piece) => {
                  const sameType =
                    !detail.tipo_madera_id ||
                    Number(detail.tipo_madera_id) ===
                      Number(piece.tipo_madera?.id ?? piece.tipo_madera_id);
                  const sameMeasure =
                    !detail.medida_id ||
                    Number(detail.medida_id) ===
                      Number(piece.medida?.id ?? piece.medida_id);
                  return sameType && sameMeasure;
                });

                return (
                  <div
                    key={detail.id}
                    className="rounded-2xl border border-border bg-surface p-4"
                  >
                    <div className="flex justify-between items-center gap-3 mb-4">
                      <div className="font-semibold text-text">
                        Detalle {index + 1}
                      </div>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => removeDetail(detail.id)}
                        disabled={details.length === 1}
                        title="Eliminar detalle"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="form-group mb-0">
                        <label className="form-label">Tipo de madera</label>
                        <select
                          className="form-input"
                          value={detail.tipo_madera_id}
                          onChange={(e) =>
                            updateDetail(detail.id, "tipo_madera_id", e.target.value)
                          }
                        >
                          <option value="">Selecciona</option>
                          {woodTypes.map((woodType) => (
                            <option key={woodType.id} value={woodType.id}>
                              {woodType.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group mb-0">
                        <label className="form-label">Medida</label>
                        <select
                          className="form-input"
                          value={detail.medida_id}
                          onChange={(e) =>
                            updateDetail(detail.id, "medida_id", e.target.value)
                          }
                        >
                          <option value="">Selecciona</option>
                          {measures.map((measure) => (
                            <option key={measure.id} value={measure.id}>
                              {measureLabel(measure)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group mb-0">
                        <label className="form-label">Pieza (opcional)</label>
                        <select
                          className="form-input"
                          value={detail.wood_piece_id}
                          onChange={(e) =>
                            updateDetail(detail.id, "wood_piece_id", e.target.value)
                          }
                        >
                          <option value="">Sin pieza específica</option>
                          {filteredPieces.map((piece) => (
                            <option key={piece.id} value={piece.id}>
                              #{piece.id} · {piece.tipo_madera?.nombre || "Madera"} ·{" "}
                              {measureLabel(piece.medida)} · {fmtNumber(piece.largo_m)}m
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group mb-0">
                        <label className="form-label">Largo (m)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-input"
                          value={detail.largo_m}
                          onChange={(e) =>
                            updateDetail(detail.id, "largo_m", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-group mb-0">
                        <label className="form-label">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          value={detail.cantidad}
                          onChange={(e) =>
                            updateDetail(detail.id, "cantidad", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-group mb-0 md:col-span-2 xl:col-span-1">
                        <label className="form-label">Notas</label>
                        <input
                          type="text"
                          className="form-input"
                          value={detail.notas}
                          onChange={(e) =>
                            updateDetail(detail.id, "notas", e.target.value)
                          }
                          placeholder="Observaciones del detalle"
                        />
                      </div>
                    </div>

                    <div className="text-xs text-text-subtle mt-3">
                      {detail.tipo_madera_id && detail.medida_id
                        ? `${woodTypeMap.get(Number(detail.tipo_madera_id))?.nombre || "Tipo"} · ${measureLabel(
                            measures.find(
                              (measure) =>
                                Number(measure.id) === Number(detail.medida_id),
                            ),
                          )}`
                        : "Completa el tipo y la medida para calcular la cotización."}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6">
            <div className="font-display font-bold text-lg text-text mb-4">
              Costos y logística
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["costo_cargue_terrestre", "Cargue terrestre"],
                ["costo_descargue_terrestre", "Descargue terrestre"],
                ["costo_cargue_maritimo", "Cargue marítimo"],
                ["costo_descargue_maritimo", "Descargue marítimo"],
                ["precio_epa_por_metro", "Precio EPA por metro"],
                ["porcentaje_anticipo", "Anticipo (%)"],
              ].map(([field, label]) => (
                <div key={field} className="form-group mb-0">
                  <label className="form-label">{label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    value={form[field]}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        [field]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}

              <div className="form-group mb-0 md:col-span-2">
                <label className="form-label">Notas generales</label>
                <textarea
                  className="form-input min-h-28"
                  value={form.notas}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, notas: e.target.value }))
                  }
                  placeholder="Notas visibles para la cotización"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="bg-white border border-border rounded-2xl p-6 sticky top-24">
            <div className="flex items-center gap-2 font-display font-bold text-lg text-text mb-4">
              <FileText size={18} />
              Resumen
            </div>

            {previewLoading ? (
              <div className="text-sm text-text-subtle">
                Calculando preview de la cotización...
              </div>
            ) : preview ? (
              <>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Subtotal piezas</span>
                    <span className="font-semibold">
                      {fmtCurrency(preview.subtotal_piezas)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Metros totales</span>
                    <span>{fmtNumber(preview.metros_totales, 4)} m</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Cargue terrestre</span>
                    <span>{fmtCurrency(preview.costo_cargue_terrestre)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Descargue terrestre</span>
                    <span>{fmtCurrency(preview.costo_descargue_terrestre)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Cargue marítimo</span>
                    <span>{fmtCurrency(preview.costo_cargue_maritimo)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Descargue marítimo</span>
                    <span>{fmtCurrency(preview.costo_descargue_maritimo)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Salvoconducto EPA</span>
                    <span>{fmtCurrency(preview.costo_salvoconducto_epa)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">EPA aplicado</span>
                    <span>{fmtCurrency(preview.precio_epa_por_metro_usado)}</span>
                  </div>
                </div>

                <div className="border-t border-border mt-4 pt-4">
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="font-display font-bold text-lg">Total</span>
                    <span className="font-display font-black text-3xl text-primary">
                      {fmtCurrency(preview.total)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-text-muted">
                    <span>Anticipo ({fmtNumber(preview.porcentaje_anticipo)}%)</span>
                    <span className="font-semibold text-accent">
                      {fmtCurrency(preview.monto_anticipo)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="font-semibold text-text">Desglose</div>
                  {preview.detalles.map((detail) => (
                    <div
                      key={detail.id}
                      className="rounded-xl border border-border bg-surface-2 p-3"
                    >
                      <div className="font-medium text-sm text-text">
                        {detail.tipo_madera?.nombre || "Madera"} ·{" "}
                        {detail.medida?.etiqueta ||
                          `${detail.medida?.ancho_in || "—"}" x ${detail.medida?.alto_in || "—"}"`}
                      </div>
                      <div className="text-xs text-text-subtle mt-1">
                        {fmtNumber(detail.largo_m)}m · {detail.cantidad} und ·{" "}
                        {detail.regla_calculo}
                      </div>
                      <div className="text-xs text-text-subtle mt-1">
                        Volumen: {fmtNumber(detail.volumen_m3, 4)} m³
                      </div>
                      <div className="text-sm font-semibold text-primary mt-2">
                        {fmtCurrency(detail.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-text-subtle">
                Completa cliente, detalles y datos mínimos para ver el preview.
              </div>
            )}

            <div className="flex flex-col gap-3 mt-6">
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={saveQuotation}
                disabled={saving || clients.length === 0}
              >
                <Save size={16} /> {saving ? "Guardando..." : "Guardar cotización"}
              </button>

              <button
                type="button"
                className="btn btn-ghost w-full"
                onClick={() => setPage(user?.role === "admin" ? "admin" : "catalog")}
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