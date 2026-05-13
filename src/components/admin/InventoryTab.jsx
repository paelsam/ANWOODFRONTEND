import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { inventoryAPI } from "@/services/inventory";
import DataTableShell from "@/components/admin/DataTableShell";
import Modal from "@/components/admin/Modal";
import {
  categoryMetaFromWoodType,
  fmtCurrency,
  formatDecimal,
  formatStrategy,
  parseOptionalNumber,
  stockBadgeTone,
} from "@/components/admin/adminUtils";

export default function InventoryTab({ notify, woodTypes, measures }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    tipo_madera_id: "",
    medida_id: "",
    largo_m: "",
    cantidad: "",
    precio_unitario: "",
    costo_unitario: "",
    estado: "disponible",
    lote_id: "",
  });

  const measuresById = useMemo(
    () => new Map(measures.map((measure) => [measure.id, measure])),
    [measures],
  );

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const pieces = await inventoryAPI.listPieces({ limit: 200 });
      setInventory(pieces);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const resetCreateForm = useCallback(() => {
    setForm({
      tipo_madera_id: woodTypes[0]?.id || "",
      medida_id: measures[0]?.id || "",
      largo_m: "",
      cantidad: "",
      precio_unitario: "",
      costo_unitario: "",
      estado: "disponible",
      lote_id: "",
    });
  }, [measures, woodTypes]);

  const openCreate = () => {
    setEditingItem(null);
    resetCreateForm();
    setModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      tipo_madera_id: item.tipo_madera?.id || "",
      medida_id: item.medida?.id || "",
      largo_m: item.largo_m != null ? String(item.largo_m) : "",
      cantidad: item.cantidad != null ? String(item.cantidad) : "",
      precio_unitario:
        item.precio_unitario != null ? String(item.precio_unitario) : "",
      costo_unitario:
        item.costo_unitario != null ? String(item.costo_unitario) : "",
      estado: item.estado || "disponible",
      lote_id: item.lote_id != null ? String(item.lote_id) : "",
    });
    setModal(true);
  };

  const save = async () => {
    try {
      if (editingItem) {
        const payload = {
          estado: form.estado || undefined,
          largo_m: parseOptionalNumber(form.largo_m),
          precio_unitario: parseOptionalNumber(form.precio_unitario),
          costo_unitario: parseOptionalNumber(form.costo_unitario),
        };

        await inventoryAPI.updatePiece(editingItem.id, payload);
        notify("Pieza actualizada");
      } else {
        if (!form.tipo_madera_id || !form.medida_id || !form.largo_m) {
          notify("Completa tipo de madera, medida y largo.", "error");
          return;
        }

        const quantity = Number(form.cantidad);
        if (Number.isNaN(quantity) || quantity < 0) {
          notify("La cantidad debe ser un número válido.", "error");
          return;
        }

        const largoM = Number(form.largo_m);
        if (Number.isNaN(largoM) || largoM <= 0) {
          notify("El largo debe ser mayor a cero.", "error");
          return;
        }

        const payload = {
          tipo_madera_id: Number(form.tipo_madera_id),
          medida_id: Number(form.medida_id),
          largo_m: largoM,
          cantidad: quantity,
          precio_unitario: parseOptionalNumber(form.precio_unitario),
          costo_unitario: parseOptionalNumber(form.costo_unitario),
          lote_id: form.lote_id ? Number(form.lote_id) : null,
        };

        await inventoryAPI.createPiece(payload);
        notify("Pieza registrada");
      }

      setModal(false);
      setEditingItem(null);
      resetCreateForm();
      loadInventory();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const remove = async (item) => {
    const confirmed = window.confirm(
      `Inactivar la pieza #${item.id}? Esta acción la marca como inactiva en el backend.`,
    );
    if (!confirmed) return;

    try {
      await inventoryAPI.deletePiece(item.id);
      notify("Pieza actualizada a inactiva", "info");
      loadInventory();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const canCreate = woodTypes.length > 0 && measures.length > 0;

  return (
    <>
      {modal && (
        <Modal
          title={editingItem ? "Editar pieza" : "Registrar pieza"}
          onClose={() => setModal(false)}
        >
          {editingItem ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Tipo de madera</label>
                  <input
                    className="form-input"
                    value={editingItem.tipo_madera?.nombre || "—"}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Medida</label>
                  <input
                    className="form-input"
                    value={
                      measuresById.get(editingItem.medida?.id)?.etiqueta ||
                      editingItem.medida?.etiqueta ||
                      `${editingItem.medida?.ancho_in || "—"} x ${editingItem.medida?.alto_in || "—"} pulgadas`
                    }
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cantidad total</label>
                  <input
                    className="form-input"
                    value={form.cantidad}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock disponible</label>
                  <input
                    className="form-input"
                    value={editingItem.stock ?? "—"}
                    disabled
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-input"
                    value={form.estado}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, estado: e.target.value }))
                    }
                  >
                    <option value="disponible">Disponible</option>
                    <option value="reservado">Reservado</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Largo (m)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.largo_m}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, largo_m: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio unitario</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.precio_unitario}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        precio_unitario: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Costo unitario</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.costo_unitario}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        costo_unitario: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-text-subtle mt-1 mb-4">
                Con el backend actual se pueden actualizar largo, estado y
                precios de una pieza existente.
              </p>
            </>
          ) : (
            <>
              {!canCreate ? (
                <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text">
                  Para registrar piezas primero deben existir tipos de madera y
                  medidas en el backend.
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Tipo de madera</label>
                  <select
                    className="form-input"
                    value={form.tipo_madera_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        tipo_madera_id: e.target.value,
                      }))
                    }
                  >
                    {woodTypes.map((woodType) => (
                      <option key={woodType.id} value={woodType.id}>
                        {woodType.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Medida</label>
                  <select
                    className="form-input"
                    value={form.medida_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        medida_id: e.target.value,
                      }))
                    }
                  >
                    {measures.map((measure) => (
                      <option key={measure.id} value={measure.id}>
                        {measure.etiqueta ||
                          `${measure.ancho_in} x ${measure.alto_in} pulgadas`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Largo (m)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.largo_m}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, largo_m: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cantidad</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.cantidad}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, cantidad: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio unitario</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.precio_unitario}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        precio_unitario: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Costo unitario</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.costo_unitario}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        costo_unitario: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="form-label">Lote (opcional)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.lote_id}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lote_id: e.target.value }))
                    }
                    placeholder="ID de lote"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setModal(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={save}
              disabled={!editingItem && !canCreate}
            >
              {editingItem ? "Guardar cambios" : "Registrar pieza"}
            </button>
          </div>
        </Modal>
      )}

      <DataTableShell
        title="Inventario"
        count={inventory.length}
        subtitle="Alta de piezas nuevas y edición de estado/precios usando el contrato actual del backend."
        action={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openCreate}
            disabled={!canCreate}
          >
            <Plus size={14} /> Nueva pieza
          </button>
        }
      >
        {loading ? (
          <div className="p-8 text-text-subtle">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Pieza</th>
                <th className="px-4 py-2 text-left font-semibold">Medida</th>
                <th className="px-4 py-2 text-left font-semibold">
                  Cantidades
                </th>
                <th className="px-4 py-2 text-left font-semibold">Precios</th>
                <th className="px-4 py-2 text-left font-semibold">Estado</th>
                <th className="px-4 py-2 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventory.map((item) => {
                const category = categoryMetaFromWoodType(item.tipo_madera);
                const measureLabel =
                  measuresById.get(item.medida?.id)?.etiqueta ||
                  item.medida?.etiqueta ||
                  `${item.medida?.ancho_in || "—"} x ${item.medida?.alto_in || "—"} pulgadas`;

                return (
                  <tr key={item.id} className="hover:bg-surface-2/50 align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text">
                        #{item.id} · {item.tipo_madera?.nombre || "Sin tipo"}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="badge badge-info">
                          {category.name}
                        </span>
                        {category.strategy ? (
                          <span className="badge badge-warning">
                            {formatStrategy(category.strategy)}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-text-subtle mt-2">
                        {item.largo_m
                          ? `Largo: ${formatDecimal(item.largo_m, 2)} m`
                          : "Largo no expuesto por la respuesta actual"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{measureLabel}</div>
                      <div className="text-xs text-text-subtle mt-1">
                        {item.medida?.ancho_in || "—"}" x{" "}
                        {item.medida?.alto_in || "—"}"
                      </div>
                      <div className="text-xs text-text-subtle mt-1">
                        Volumen: {formatDecimal(item.volumen_m3, 4)} m³
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        Total: <strong>{item.cantidad ?? "—"}</strong>
                      </div>
                      <div className="text-sm text-text-subtle">
                        Reservadas: {item.cantidad_reservada ?? "—"}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`badge ${stockBadgeTone(
                            Number(item.stock || 0),
                          )}`}
                        >
                          Stock {item.stock ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">
                        Venta: {fmtCurrency(item.precio_unitario)}
                      </div>
                      <div className="text-xs text-text-subtle mt-1">
                        Costo: {fmtCurrency(item.costo_unitario)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "badge " +
                          (item.estado === "disponible"
                            ? "badge-success"
                            : item.estado === "reservado"
                              ? "badge-warning"
                              : "badge-danger")
                        }
                      >
                        {item.estado || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => openEdit(item)}
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => remove(item)}
                          title="Inactivar"
                          disabled={item.estado === "inactivo"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </DataTableShell>
    </>
  );
}
