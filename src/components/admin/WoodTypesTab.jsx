import { useCallback, useRef, useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import { uploadWoodTypeImage } from "@/services/uploads";
import { inventoryAPI } from "@/services/inventory";
import DataTableShell from "@/components/admin/DataTableShell";
import Modal from "@/components/admin/Modal";
import {
  categoryMetaFromWoodType,
  fmtCurrency,
  formatStrategy,
} from "@/components/admin/adminUtils";

export default function WoodTypesTab({
  notify,
  woodTypes,
  categories,
  reloadWoodData,
}) {
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
                        (item.activo === false
                          ? "badge-danger"
                          : "badge-success")
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
