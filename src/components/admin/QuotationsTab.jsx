import { useCallback, useEffect, useMemo, useState } from "react";
import { quotationsAPI } from "@/services/quotations";
import { usersAPI } from "@/services/users";
import DataTableShell from "@/components/admin/DataTableShell";
import Modal from "@/components/admin/Modal";
import { fmtCurrency, fmtNumber } from "@/components/admin/adminUtils";

export default function QuotationsTab({ notify }) {
  const [quotations, setQuotations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState("");
  const [tipoCompraFilter, setTipoCompraFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

  const userMap = useMemo(
    () => new Map(users.map((entry) => [entry.id, entry])),
    [users],
  );

  const filteredQuotations = useMemo(() => {
    return quotations.filter((quotation) => {
      if (estadoFilter && quotation.estado !== estadoFilter) return false;
      if (tipoCompraFilter && quotation.tipo_compra !== tipoCompraFilter) {
        return false;
      }
      if (userFilter && String(quotation.user_id) !== userFilter) return false;
      return true;
    });
  }, [estadoFilter, quotations, tipoCompraFilter, userFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [quotationList, userList] = await Promise.all([
        quotationsAPI.list({ limit: 200 }),
        usersAPI.list(),
      ]);

      setUsers(Array.isArray(userList) ? userList : []);
      setQuotations(Array.isArray(quotationList) ? quotationList : []);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const updateEstado = async (quotation, estado) => {
    try {
      await quotationsAPI.update(quotation.id, { estado });
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

  const openQuotation = async (quotation) => {
    setSelectedLoading(true);
    setSelectedQuotation(null);
    try {
      const detail = await quotationsAPI.get(quotation.id);
      setSelectedQuotation(detail);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSelectedLoading(false);
    }
  };

  return (
    <>
      {(selectedQuotation || selectedLoading) && (
        <Modal
          title={`Cotización #${selectedQuotation?.id || ""}`}
          onClose={() => setSelectedQuotation(null)}
        >
          {selectedLoading ? (
            <div className="text-sm text-text-subtle">Cargando...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="text-xs text-text-subtle uppercase tracking-wide mb-1">
                    Usuario
                  </div>
                  <div className="font-semibold text-text">
                    {userMap.get(selectedQuotation.user_id)?.full_name ||
                      userMap.get(selectedQuotation.user_id)?.username ||
                      `Usuario #${selectedQuotation.user_id}`}
                  </div>
                  <div className="text-xs text-text-subtle mt-1">
                    Estado: {selectedQuotation.estado}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="text-xs text-text-subtle uppercase tracking-wide mb-1">
                    Total monto
                  </div>
                  <div className="font-semibold text-primary">
                    {fmtCurrency(selectedQuotation.total_monto)}
                  </div>
                  <div className="text-xs text-text-subtle mt-1">
                    Anticipo: {fmtCurrency(selectedQuotation.valor_anticipo)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Numero
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {selectedQuotation.numero_cotizacion || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Tipo compra
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {selectedQuotation.tipo_compra || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Total m3
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtNumber(selectedQuotation.total_m3, 4)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Subtotal
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtCurrency(selectedQuotation.subtotal)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Transporte
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtCurrency(selectedQuotation.costo_transporte)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Cargue
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtCurrency(selectedQuotation.costo_cargue)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Descargue
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtCurrency(selectedQuotation.costo_descargue)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Salvoconducto
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtCurrency(selectedQuotation.costo_salvoconducto)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Anticipo
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {fmtNumber(selectedQuotation.porcentaje_anticipo, 2)}%
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Emision
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {selectedQuotation.fecha_emision || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Vencimiento
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {selectedQuotation.fecha_vencimiento || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="text-xs uppercase tracking-[2px] text-text-muted">
                    Salvoconducto manual
                  </div>
                  <div className="font-semibold text-text mt-1">
                    {selectedQuotation.salvoconducto_es_manual ? "Si" : "No"}
                  </div>
                </div>
              </div>

              {Array.isArray(selectedQuotation.detalles) &&
              selectedQuotation.detalles.length > 0 ? (
                <div className="space-y-3">
                  {selectedQuotation.detalles.map((detail) => (
                    <div
                      key={detail.id}
                      className="rounded-xl border border-border bg-surface-2 p-4"
                    >
                      <div className="font-semibold text-text">
                        {detail.descripcion_item || "Detalle"}
                      </div>
                      <div className="text-xs text-text-subtle mt-1">
                        Pieza #{detail.pieza_id} · {detail.cantidad} und
                      </div>
                      <div className="text-xs text-text-subtle mt-1">
                        Volumen: {fmtNumber(detail.volumen_unitario_m3, 4)} m3
                      </div>
                      <div className="text-sm font-semibold text-primary mt-2">
                        {fmtCurrency(detail.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

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
          )}
        </Modal>
      )}

      <DataTableShell
        title="Cotizaciones"
        count={filteredQuotations.length}
        subtitle="Listado, filtros y gestion de cotizaciones del backend."
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
              value={tipoCompraFilter}
              onChange={(e) => setTipoCompraFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="por_pedido">por_pedido</option>
              <option value="por_pulgadas">por_pulgadas</option>
            </select>
            <select
              className="form-input py-2 min-w-[190px]"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="">Todos los usuarios</option>
              {users.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.full_name || entry.username || `Usuario #${entry.id}`}
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
                <th className="px-4 py-2 text-left font-semibold">Numero</th>
                <th className="px-4 py-2 text-left font-semibold">Usuario</th>
                <th className="px-4 py-2 text-left font-semibold">Tipo</th>
                <th className="px-4 py-2 text-left font-semibold">Emision</th>
                <th className="px-4 py-2 text-left font-semibold">Total</th>
                <th className="px-4 py-2 text-left font-semibold">Estado</th>
                <th className="px-4 py-2 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredQuotations.map((quotation) => (
                <tr
                  key={quotation.id}
                  className="hover:bg-surface-2/50 align-top"
                >
                  <td className="px-4 py-3 font-semibold text-primary">
                    #{quotation.id}
                  </td>
                  <td className="px-4 py-3">
                    {quotation.numero_cotizacion || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {userMap.get(quotation.user_id)?.full_name ||
                      userMap.get(quotation.user_id)?.username ||
                      `Usuario #${quotation.user_id}`}
                  </td>
                  <td className="px-4 py-3">{quotation.tipo_compra || "—"}</td>
                  <td className="px-4 py-3">
                    {quotation.fecha_emision
                      ? new Date(quotation.fecha_emision).toLocaleDateString(
                          "es-CO",
                        )
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {fmtCurrency(quotation.total_monto)}
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
                        onClick={() => openQuotation(quotation)}
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-danger"
                        onClick={() => remove(quotation)}
                      >
                        Eliminar
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
