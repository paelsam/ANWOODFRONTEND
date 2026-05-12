import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { clientsAPI } from "@/services/clients";
import { uploadWoodTypeImage } from "@/services/uploads";
import { usersAPI } from "@/services/users";
import { inventoryAPI } from "@/services/inventory";
import { quotationsAPI } from "@/services/quotations";

const fmtCurrency = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const formatDecimal = (value, digits = 2) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "—";
  return numeric.toFixed(digits);
};

const parseOptionalNumber = (value) => {
  if (value === "" || value == null) return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const categoryMetaFromWoodType = (woodType) => {
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

const formatStrategy = (strategy) =>
  strategy ? strategy.replace(/_/g, " ") : "";

const stockBadgeTone = (stock) => {
  if (stock > 50) return "badge-success";
  if (stock > 10) return "badge-warning";
  return "badge-danger";
};

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-1000 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-border rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-bold text-xl text-text">{title}</h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DataTableShell({ title, count, subtitle, action, children }) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 border-b border-border bg-surface-2">
        <div>
          <div className="font-display font-bold text-text">
            {title} ({count})
          </div>
          {subtitle ? (
            <div className="text-xs text-text-subtle mt-1">{subtitle}</div>
          ) : null}
        </div>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function InventoryTab({ notify, woodTypes, measures }) {
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
                  <input className="form-input" value={form.cantidad} disabled />
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
                <th className="px-4 py-2 text-left font-semibold">Cantidades</th>
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
                        <span className="badge badge-info">{category.name}</span>
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

function WoodTypesTab({ notify, woodTypes, categories, reloadWoodData }) {
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const imageInputRef = useRef(null);
  const [form, setForm] = useState({
    nombre: "",
    categoria_id: "",
    densidad_kg_m3: "",
    precio_por_metro: "",
    descripcion: "",
    activo: "true",
    imagenes: [],
  });

  const openCreate = () => {
    setEditingId(null);
    setIsDraggingImages(false);
    setForm({
      nombre: "",
      categoria_id: categories[0]?.id || "",
      densidad_kg_m3: "",
      precio_por_metro: "",
      descripcion: "",
      activo: "true",
      imagenes: [],
    });
    setModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setIsDraggingImages(false);
    setForm({
      nombre: item.nombre || "",
      categoria_id: item.categoria?.id || "",
      densidad_kg_m3:
        item.densidad_kg_m3 != null ? String(item.densidad_kg_m3) : "",
      precio_por_metro:
        item.precio_por_metro != null ? String(item.precio_por_metro) : "",
      descripcion: item.descripcion || "",
      activo: item.activo === false ? "false" : "true",
      imagenes: Array.isArray(item.imagenes) ? item.imagenes : [],
    });
    setModal(true);
  };

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;

      for (const file of files) {
        try {
          const imageUrl = await uploadWoodTypeImage(file);
          if (typeof imageUrl === "string" && imageUrl) {
            setForm((prev) => ({
              ...prev,
              imagenes: [...prev.imagenes, imageUrl],
            }));
          }
        } catch (err) {
          notify(err.message, "error");
        }
      }
    },
    [notify],
  );

  const removeImage = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, imageIndex) => imageIndex !== index),
    }));
  }, []);

  const save = async () => {
    try {
      if (!form.nombre || !form.categoria_id) {
        notify("Completa nombre y categoría.", "error");
        return;
      }

      const payload = {
        nombre: form.nombre,
        categoria_id: Number(form.categoria_id),
        densidad_kg_m3: Number(form.densidad_kg_m3),
        precio_por_metro: Number(form.precio_por_metro),
        descripcion: form.descripcion || null,
        activo: form.activo === "true",
        imagenes: form.imagenes,
      };

      if (
        Number.isNaN(payload.densidad_kg_m3) ||
        Number.isNaN(payload.precio_por_metro)
      ) {
        notify("Densidad y precio por metro deben ser numéricos.", "error");
        return;
      }

      if (editingId) {
        await inventoryAPI.updateWoodType(editingId, payload);
        notify("Tipo de madera actualizado");
      } else {
        await inventoryAPI.createWoodType(payload);
        notify("Tipo de madera registrado");
      }

      setModal(false);
      reloadWoodData();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const remove = async (item) => {
    const confirmed = window.confirm(
      `Eliminar el tipo de madera ${item.nombre}?`,
    );
    if (!confirmed) return;

    try {
      await inventoryAPI.deleteWoodType(item.id);
      notify("Tipo de madera eliminado", "info");
      reloadWoodData();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  return (
    <>
      {modal && (
        <Modal
          title={editingId ? "Editar tipo de madera" : "Nuevo tipo de madera"}
          onClose={() => setModal(false)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-input"
                value={form.nombre}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nombre: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                className="form-input"
                value={form.categoria_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    categoria_id: e.target.value,
                  }))
                }
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Densidad (kg/m³)</label>
              <input
                type="number"
                className="form-input"
                value={form.densidad_kg_m3}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    densidad_kg_m3: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Precio por metro</label>
              <input
                type="number"
                className="form-input"
                value={form.precio_por_metro}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    precio_por_metro: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Descripción</label>
              <input
                type="text"
                className="form-input"
                value={form.descripcion}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    descripcion: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Estado</label>
              <select
                className="form-input"
                value={form.activo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, activo: e.target.value }))
                }
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Imágenes</label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <div
                className={
                  "rounded-2xl border-2 border-dashed p-5 transition " +
                  (isDraggingImages
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface-2")
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingImages(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingImages(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingImages(false);
                  handleFiles(e.dataTransfer.files);
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="font-medium text-text">
                      Arrastra imágenes aquí o selecciónalas
                    </div>
                    <div className="text-xs text-text-subtle mt-1">
                      La subida real se habilitará cuando se integre Cloudinary.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    Seleccionar archivos
                  </button>
                </div>

                {form.imagenes.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {form.imagenes.map((imageUrl, index) => (
                      <div
                        key={`${imageUrl}-${index}`}
                        className="relative rounded-xl overflow-hidden border border-border bg-white"
                      >
                        <img
                          src={imageUrl}
                          alt={`Imagen ${index + 1} de ${form.nombre || "tipo de madera"}`}
                          className="w-full aspect-square object-cover"
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-danger transition"
                          onClick={() => removeImage(index)}
                          title="Eliminar imagen"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-text-subtle mt-4">
                    No hay imágenes asociadas todavía.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setModal(false)}
            >
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={save}>
              {editingId ? "Guardar cambios" : "Crear tipo"}
            </button>
          </div>
        </Modal>
      )}

      <DataTableShell
        title="Tipos de madera"
        count={woodTypes.length}
        subtitle="La categoría, estrategia de precio y cubicación se leen desde el backend actual."
        action={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openCreate}
            disabled={categories.length === 0}
          >
            <Plus size={14} /> Nuevo tipo
          </button>
        }
      >
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Tipo</th>
              <th className="px-4 py-2 text-left font-semibold">Categoría</th>
              <th className="px-4 py-2 text-left font-semibold">Precio</th>
              <th className="px-4 py-2 text-left font-semibold">Estado</th>
              <th className="px-4 py-2 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {woodTypes.map((item) => {
              const category = categoryMetaFromWoodType(item);
              return (
                <tr key={item.id} className="hover:bg-surface-2/50 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{item.nombre}</div>
                    {item.descripcion ? (
                      <div className="text-xs text-text-subtle mt-1">
                        {item.descripcion}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{category.name}</div>
                    {category.strategy ? (
                      <div className="text-xs text-text-subtle mt-1">
                        Estrategia: {formatStrategy(category.strategy)}
                      </div>
                    ) : null}
                    <div className="text-xs text-text-subtle mt-1">
                      {category.allowsCubic
                        ? "Permite cubicación"
                        : "Sin cubicación"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {fmtCurrency(item.precio_por_metro)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "badge " +
                        (item.activo === false ? "badge-danger" : "badge-success")
                      }
                    >
                      {item.activo === false ? "inactivo" : "activo"}
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
                        title="Eliminar"
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
      </DataTableShell>
    </>
  );
}

function UsersTab({ notify }) {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    role_id: 1,
    password: "",
  });
  const [editForm, setEditForm] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    role_id: 1,
    password: "",
    disable: "",
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await usersAPI.list());
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      const payload = {
        username: form.username,
        full_name: form.full_name || null,
        email: form.email,
        phone: form.phone || null,
        role_id: Number(form.role_id),
        password: form.password,
      };

      await usersAPI.create(payload);
      notify("Usuario registrado");
      setModal(false);
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const openEdit = (user) => {
    setEditingId(user.id);
    setEditForm({
      username: user.username || "",
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role_id: user.role_id ?? 1,
      password: "",
      disable: user.disabled ? "true" : "false",
    });
    setEditModal(true);
  };

  const updateUser = async () => {
    try {
      const payload = {
        username: editForm.username,
        full_name: editForm.full_name || null,
        email: editForm.email,
        phone: editForm.phone || null,
        role_id: Number(editForm.role_id),
        disabled: editForm.disable === "true",
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      await usersAPI.update(editingId, payload);
      notify("Usuario actualizado");
      setEditModal(false);
      setEditingId(null);
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const removeUser = async (user) => {
    const confirmed = window.confirm(
      `Inactivar al usuario ${user.username}? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    try {
      await usersAPI.remove(user.id);
      notify("Usuario inactivado");
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  return (
    <>
      {modal && (
        <Modal title="Nuevo usuario" onClose={() => setModal(false)}>
          {[
            ["username", "Usuario", "text"],
            ["full_name", "Nombre completo", "text"],
            ["email", "Correo electrónico", "email"],
            ["phone", "Teléfono", "text"],
            ["password", "Contraseña", "password"],
          ].map(([field, label, type]) => (
            <div className="form-group" key={field}>
              <label className="form-label">{label}</label>
              <input
                type={type}
                className="form-input"
                value={form[field]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [field]: e.target.value }))
                }
              />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Rol</label>
            <select
              className="form-input"
              value={form.role_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, role_id: e.target.value }))
              }
            >
              <option value={3}>Cliente</option>
              <option value={1}>Administrador</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setModal(false)}
            >
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={save}>
              Crear usuario
            </button>
          </div>
        </Modal>
      )}

      {editModal && (
        <Modal title="Actualizar usuario" onClose={() => setEditModal(false)}>
          {[
            ["username", "Usuario", "text"],
            ["full_name", "Nombre completo", "text"],
            ["email", "Correo electrónico", "email"],
            ["phone", "Teléfono", "text"],
            ["password", "Nueva contraseña (opcional)", "password"],
          ].map(([field, label, type]) => (
            <div className="form-group" key={field}>
              <label className="form-label">{label}</label>
              <input
                type={type}
                className="form-input"
                value={editForm[field]}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, [field]: e.target.value }))
                }
              />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Rol</label>
            <select
              className="form-input"
              value={editForm.role_id}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, role_id: e.target.value }))
              }
            >
              <option value={3}>Cliente</option>
              <option value={1}>Administrador</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select
              className="form-input"
              value={editForm.disable}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, disable: e.target.value }))
              }
            >
              <option value="false">Activo</option>
              <option value="true">Inactivo</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setEditModal(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={updateUser}
            >
              Guardar cambios
            </button>
          </div>
        </Modal>
      )}

      <DataTableShell
        title="Usuarios"
        count={users.length}
        action={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setModal(true)}
          >
            <Plus size={14} /> Nuevo usuario
          </button>
        }
      >
        {loading ? (
          <div className="p-8 text-text-subtle">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Usuario</th>
                <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                <th className="px-4 py-2 text-left font-semibold">Email</th>
                <th className="px-4 py-2 text-left font-semibold">Teléfono</th>
                <th className="px-4 py-2 text-left font-semibold">Rol</th>
                <th className="px-4 py-2 text-left font-semibold">Estado</th>
                <th className="px-4 py-2 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-2 font-medium">{u.username}</td>
                  <td className="px-4 py-2">{u.full_name || "—"}</td>
                  <td className="px-4 py-2 text-text-subtle">{u.email || "—"}</td>
                  <td className="px-4 py-2 text-text-subtle">
                    {u.phone || "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        "badge " +
                        (u.role_id === 1 ? "badge-warning" : "badge-info")
                      }
                    >
                      {u.role_id === 1 ? "admin" : "cliente"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        "badge " +
                        (u.disabled ? "badge-danger" : "badge-success")
                      }
                    >
                      {u.disabled ? "inactivo" : "activo"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEdit(u)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-danger"
                        onClick={() => removeUser(u)}
                      >
                        Inactivar
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

function ClientsTab({ notify }) {
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [statusFilter, setStatusFilter] = useState("active");
  const [form, setForm] = useState({
    usuario_id: "",
    tipo_cliente: "empresa",
    nombre_razon_social: "",
    identificacion_fiscal: "",
    email: "",
    telefono: "",
    direccion: "",
    activo: "true",
  });

  const usersMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [userList, activeClients, inactiveClients] = await Promise.all([
        usersAPI.list(),
        clientsAPI.list(true),
        clientsAPI.list(false),
      ]);

      setUsers(userList);

      const clientList =
        statusFilter === "active"
          ? activeClients
          : statusFilter === "inactive"
            ? inactiveClients
            : Array.from(
                new Map(
                  [...activeClients, ...inactiveClients].map((client) => [
                    client.id,
                    client,
                  ]),
                ).values(),
              );

      setClients(clientList);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [notify, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingClient(null);
    setForm({
      usuario_id: users[0]?.id ? String(users[0].id) : "",
      tipo_cliente: "empresa",
      nombre_razon_social: "",
      identificacion_fiscal: "",
      email: "",
      telefono: "",
      direccion: "",
      activo: "true",
    });
    setModal(true);
  };

  const openEdit = (client) => {
    setEditingClient(client);
    setForm({
      usuario_id: client.usuario_id ? String(client.usuario_id) : "",
      tipo_cliente: client.tipo_cliente || "empresa",
      nombre_razon_social: client.nombre_razon_social || "",
      identificacion_fiscal: client.identificacion_fiscal || "",
      email: client.email || "",
      telefono: client.telefono || "",
      direccion: client.direccion || "",
      activo: client.activo === false ? "false" : "true",
    });
    setModal(true);
  };

  const save = async () => {
    try {
      if (
        !form.usuario_id ||
        !form.tipo_cliente ||
        !form.nombre_razon_social ||
        !form.identificacion_fiscal
      ) {
        notify("Completa usuario, tipo, razón social e identificación.", "error");
        return;
      }

      const payload = {
        usuario_id: Number(form.usuario_id),
        tipo_cliente: form.tipo_cliente,
        nombre_razon_social: form.nombre_razon_social,
        identificacion_fiscal: form.identificacion_fiscal,
        email: form.email || null,
        telefono: form.telefono || null,
        direccion: form.direccion || null,
        activo: form.activo === "true",
      };

      if (editingClient) {
        await clientsAPI.update(editingClient.id, payload);
        notify("Cliente actualizado");
      } else {
        await clientsAPI.create(payload);
        notify("Cliente creado");
      }

      setModal(false);
      setEditingClient(null);
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const remove = async (client) => {
    const confirmed = window.confirm(
      `Inactivar al cliente ${client.nombre_razon_social}?`,
    );
    if (!confirmed) return;

    try {
      await clientsAPI.remove(client.id);
      notify("Cliente inactivado", "info");
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  return (
    <>
      {modal && (
        <Modal
          title={editingClient ? "Editar cliente" : "Nuevo cliente"}
          onClose={() => setModal(false)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Usuario</label>
              <select
                className="form-input"
                value={form.usuario_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, usuario_id: e.target.value }))
                }
              >
                <option value="">Selecciona un usuario</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de cliente</label>
              <select
                className="form-input"
                value={form.tipo_cliente}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tipo_cliente: e.target.value }))
                }
              >
                <option value="empresa">Empresa</option>
                <option value="persona">Persona natural</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nombre o razón social</label>
              <input
                className="form-input"
                value={form.nombre_razon_social}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    nombre_razon_social: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Identificación fiscal</label>
              <input
                className="form-input"
                value={form.identificacion_fiscal}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    identificacion_fiscal: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Correo</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                className="form-input"
                value={form.telefono}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, telefono: e.target.value }))
                }
              />
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Dirección</label>
              <input
                className="form-input"
                value={form.direccion}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, direccion: e.target.value }))
                }
              />
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Estado</label>
              <select
                className="form-input"
                value={form.activo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, activo: e.target.value }))
                }
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setModal(false)}
            >
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={save}>
              {editingClient ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </Modal>
      )}

      <DataTableShell
        title="Clientes"
        count={clients.length}
        subtitle="Clientes para asociar a cotizaciones del backend actual."
        action={
          <div className="flex flex-wrap gap-2">
            <select
              className="form-input py-2 min-w-[150px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="all">Todos</option>
            </select>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openCreate}
              disabled={users.length === 0}
            >
              <Plus size={14} /> Nuevo cliente
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="p-8 text-text-subtle">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Cliente</th>
                <th className="px-4 py-2 text-left font-semibold">Tipo</th>
                <th className="px-4 py-2 text-left font-semibold">Contacto</th>
                <th className="px-4 py-2 text-left font-semibold">Usuario</th>
                <th className="px-4 py-2 text-left font-semibold">Estado</th>
                <th className="px-4 py-2 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-surface-2/50 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text">
                      {client.nombre_razon_social}
                    </div>
                    <div className="text-xs text-text-subtle mt-1">
                      {client.identificacion_fiscal}
                    </div>
                  </td>
                  <td className="px-4 py-3">{client.tipo_cliente}</td>
                  <td className="px-4 py-3">
                    <div>{client.email || "—"}</div>
                    <div className="text-xs text-text-subtle mt-1">
                      {client.telefono || client.direccion || "Sin contacto"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {usersMap.get(client.usuario_id)?.username || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "badge " +
                        (client.activo ? "badge-success" : "badge-danger")
                      }
                    >
                      {client.activo ? "activo" : "inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEdit(client)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-danger"
                        onClick={() => remove(client)}
                        disabled={!client.activo}
                      >
                        Inactivar
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

function QuotationsTab({ notify }) {
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
      const [activeClients, inactiveClients, quotationList] = await Promise.all([
        clientsAPI.list(true),
        clientsAPI.list(false),
        quotationsAPI.list({
          limit: 100,
          estado: estadoFilter || undefined,
          cliente_id: clientFilter || undefined,
        }),
      ]);

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
                  {clientMap.get(selectedQuotation.cliente_id)?.nombre_razon_social ||
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
                    {new Date(quotation.fecha_creacion).toLocaleDateString("es-CO")}
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

export default function Admin() {
  const { user, notify, setPage } = useApp();
  const [tab, setTab] = useState("inventory");
  const [woodTypes, setWoodTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [measures, setMeasures] = useState([]);
  const [supportLoading, setSupportLoading] = useState(true);

  const reloadWoodData = useCallback(async () => {
    setSupportLoading(true);
    try {
      const [types, categoryList, measureList] = await Promise.all([
        inventoryAPI.listWoodTypes(),
        inventoryAPI.listCategories(),
        inventoryAPI.listMeasures(),
      ]);
      setWoodTypes(types);
      setCategories(categoryList);
      setMeasures(measureList);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSupportLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (user?.role === "admin") {
      reloadWoodData();
    }
  }, [reloadWoodData, user]);

  if (!user || user.role !== "admin") {
    return (
      <div className="text-center py-20 px-6">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="font-display font-bold text-3xl text-text mb-3">
          Acceso restringido
        </h2>
        <p className="text-text-muted mb-6">
          Debes iniciar sesión como administrador.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setPage("login")}
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "inventory", label: "Inventario" },
    { id: "woodtypes", label: "Tipos de madera" },
    { id: "quotations", label: "Cotizaciones" },
    { id: "clients", label: "Clientes" },
    { id: "users", label: "Usuarios" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-black text-3xl md:text-4xl text-primary">
            Panel <span className="text-accent">Administrativo</span>
          </h1>
          <p className="text-sm text-text-muted mt-2">
            Gestión de inventario, clientes, cotizaciones y usuarios con el
            contrato actual del backend.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 bg-surface border border-border rounded-full p-1">
          {tabs.map((item) => (
            <button
              type="button"
              key={item.id}
              className={
                "px-4 py-1.5 rounded-full text-sm font-medium transition cursor-pointer " +
                (tab === item.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:text-primary")
              }
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {supportLoading ? (
        <div className="bg-white border border-border rounded-2xl p-8 text-text-subtle">
          Cargando catálogos del panel…
        </div>
      ) : (
        <>
          {tab === "inventory" && (
            <InventoryTab
              notify={notify}
              woodTypes={woodTypes}
              measures={measures}
            />
          )}
          {tab === "woodtypes" && (
            <WoodTypesTab
              notify={notify}
              woodTypes={woodTypes}
              categories={categories}
              reloadWoodData={reloadWoodData}
            />
          )}
          {tab === "quotations" && <QuotationsTab notify={notify} />}
          {tab === "clients" && <ClientsTab notify={notify} />}
          {tab === "users" && <UsersTab notify={notify} />}
        </>
      )}
    </div>
  );
}
