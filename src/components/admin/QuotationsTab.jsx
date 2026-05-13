import { useCallback, useEffect, useMemo, useState } from "react";
import { clientsAPI } from "@/services/clients";
import { quotationsAPI } from "@/services/quotations";
import DataTableShell from "@/components/admin/DataTableShell";
import Modal from "@/components/admin/Modal";
import { fmtCurrency, fmtNumber } from "@/components/admin/adminUtils";

export default function QuotationsTab({ notify }) {
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const clientMap = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [activeClients, inactiveClients, quotationList] = await Promise.all(
        [
          clientsAPI.list(true),
          clientsAPI.list(false),
          quotationsAPI.list({
            limit: 100,
            estado: estadoFilter || undefined,
            cliente_id: clientFilter || undefined,
          }),
        ],
      );

      setClients(
        Array.from(
          new Map(
            [...activeClients, ...inactiveClients].map((client) => [
              client.id,
              client,
            ]),
          ).values(),
        ),
      );
      setQuotations(quotationList);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [clientFilter, estadoFilter, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const updateEstado = async (quotation, estado) => {
    try {
      await quotationsAPI.setEstado(quotation.id, estado);
      notify(`Cotización #${quotation.id} actualizada a ${estado}`);
      setSelectedQuotation(null);
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const remove = async (quotation) => {
    const confirmed = window.confirm(
      `Cancelar la cotización #${quotation.id}?`,
    );
    if (!confirmed) return;

    try {
      await quotationsAPI.remove(quotation.id);
      notify("Cotización cancelada", "info");
      setSelectedQuotation(null);
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  return (
    <>
      {selectedQuotation && (
        <Modal
          title={`Cotización #${selectedQuotation.id}`}
          onClose={() => setSelectedQuotation(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="text-xs text-text-subtle uppercase tracking-wide mb-1">
                  Cliente
                </div>
                <div className="font-semibold text-text">
                  {clientMap.get(selectedQuotation.cliente_id)
                    ?.nombre_razon_social ||
                    `Cliente #${selectedQuotation.cliente_id}`}
                </div>
                <div className="text-xs text-text-subtle mt-1">
                  Estado: {selectedQuotation.estado}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="text-xs text-text-subtle uppercase tracking-wide mb-1">
                  Totales
                </div>
                <div className="font-semibold text-primary">
                  {fmtCurrency(selectedQuotation.total)}
                </div>
                <div className="text-xs text-text-subtle mt-1">
                  Anticipo: {fmtCurrency(selectedQuotation.monto_anticipo)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {selectedQuotation.detalles.map((detail) => (
                <div
                  key={detail.id}
                  className="rounded-xl border border-border bg-surface-2 p-4"
                >
                  <div className="font-semibold text-text">
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

            <div className="flex flex-wrap justify-end gap-2">
              {selectedQuotation.estado !== "aprobada" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => updateEstado(selectedQuotation, "aprobada")}
                >
                  Aprobar
                </button>
              )}
              {selectedQuotation.estado !== "rechazada" && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => updateEstado(selectedQuotation, "rechazada")}
                >
                  Rechazar
                </button>
              )}
              {selectedQuotation.estado !== "cancelada" && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => updateEstado(selectedQuotation, "cancelada")}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      <DataTableShell
        title="Cotizaciones"
        count={quotations.length}
        subtitle="Listado y cambio de estado de cotizaciones del nuevo backend."
        action={
          <div className="flex flex-wrap gap-2">
            <select
              className="form-input py-2 min-w-[150px]"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <select
              className="form-input py-2 min-w-[190px]"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="">Todos los clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nombre_razon_social}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {loading ? (
          <div className="p-8 text-text-subtle">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">ID</th>
                <th className="px-4 py-2 text-left font-semibold">Cliente</th>
                <th className="px-4 py-2 text-left font-semibold">Fecha</th>
                <th className="px-4 py-2 text-left font-semibold">Detalles</th>
                <th className="px-4 py-2 text-left font-semibold">Total</th>
                <th className="px-4 py-2 text-left font-semibold">Estado</th>
                <th className="px-4 py-2 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotations.map((quotation) => (
                <tr
                  key={quotation.id}
                  className="hover:bg-surface-2/50 align-top"
                >
                  <td className="px-4 py-3 font-semibold text-primary">
                    #{quotation.id}
                  </td>
                  <td className="px-4 py-3">
                    {clientMap.get(quotation.cliente_id)?.nombre_razon_social ||
                      `Cliente #${quotation.cliente_id}`}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(quotation.fecha_creacion).toLocaleDateString(
                      "es-CO",
                    )}
                  </td>
                  <td className="px-4 py-3">{quotation.detalles.length}</td>
                  <td className="px-4 py-3 font-semibold">
                    {fmtCurrency(quotation.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "badge " +
                        (quotation.estado === "aprobada"
                          ? "badge-success"
                          : quotation.estado === "borrador"
                            ? "badge-warning"
                            : "badge-danger")
                      }
                    >
                      {quotation.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedQuotation(quotation)}
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-danger"
                        onClick={() => remove(quotation)}
                        disabled={quotation.estado === "cancelada"}
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataTableShell>
    </>
  );
}
