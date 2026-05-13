import { useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { categoriesAPI } from "@/services/category";
import DataTableShell from "@/components/admin/DataTableShell";
import Modal from "@/components/admin/Modal";
import {
  fmtCurrency,
  formatStrategy,
  parseOptionalNumber,
} from "@/components/admin/adminUtils";

export default function CategoriesTab({ notify, categories, reloadWoodData }) {
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    estrategia_precio: "",
    permite_cubicacion: "false",
    min_precio_m3: "",
    max_precio_m3: "",
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({
      nombre: "",
      estrategia_precio: "",
      permite_cubicacion: "false",
      min_precio_m3: "",
      max_precio_m3: "",
    });
    setModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      nombre: item.nombre || "",
      estrategia_precio: item.estrategia_precio || "",
      permite_cubicacion: item.permite_cubicacion ? "true" : "false",
      min_precio_m3:
        item.min_precio_m3 != null ? String(item.min_precio_m3) : "",
      max_precio_m3:
        item.max_precio_m3 != null ? String(item.max_precio_m3) : "",
    });
    setModal(true);
  };

  const save = async () => {
    try {
      if (!form.nombre || !form.estrategia_precio || !form.min_precio_m3) {
        notify("Completa nombre, estrategia y precio minimo.", "error");
        return;
      }

      const minPrice = Number(form.min_precio_m3);
      if (Number.isNaN(minPrice) || minPrice <= 0) {
        notify("El precio minimo debe ser un numero valido.", "error");
        return;
      }

      const maxPrice = parseOptionalNumber(form.max_precio_m3);
      if (maxPrice != null && maxPrice < minPrice) {
        notify("El precio maximo no puede ser menor al minimo.", "error");
        return;
      }

      const payload = {
        nombre: form.nombre,
        estrategia_precio: form.estrategia_precio,
        permite_cubicacion: form.permite_cubicacion === "true",
        min_precio_m3: minPrice,
        max_precio_m3: maxPrice,
      };

      if (editingId) {
        await categoriesAPI.update(editingId, payload);
        notify("Categoria actualizada");
      } else {
        await categoriesAPI.create(payload);
        notify("Categoria creada");
      }

      setModal(false);
      setEditingId(null);
      reloadWoodData();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const remove = async (item) => {
    const confirmed = window.confirm(
      `Eliminar la categoria ${item.nombre}? Esta accion es permanente.`,
    );
    if (!confirmed) return;

    try {
      await categoriesAPI.remove(item.id);
      notify("Categoria eliminada", "info");
      reloadWoodData();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  return (
    <>
      {modal && (
        <Modal
          title={editingId ? "Editar categoria" : "Nueva categoria"}
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
              <label className="form-label">Estrategia de precio</label>
              <input
                type="text"
                className="form-input"
                value={form.estrategia_precio}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    estrategia_precio: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Permite cubicacion</label>
              <select
                className="form-input"
                value={form.permite_cubicacion}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    permite_cubicacion: e.target.value,
                  }))
                }
              >
                <option value="true">Si</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Precio minimo por m3</label>
              <input
                type="number"
                className="form-input"
                value={form.min_precio_m3}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    min_precio_m3: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Precio maximo por m3</label>
              <input
                type="number"
                className="form-input"
                value={form.max_precio_m3}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    max_precio_m3: e.target.value,
                  }))
                }
              />
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
              {editingId ? "Guardar cambios" : "Crear categoria"}
            </button>
          </div>
        </Modal>
      )}

      <DataTableShell
        title="Categorias"
        count={categories.length}
        subtitle="Rango de precio por m3 y estrategia segun el backend."
        action={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openCreate}
          >
            <Plus size={14} /> Nueva categoria
          </button>
        }
      >
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Categoria</th>
              <th className="px-4 py-2 text-left font-semibold">Estrategia</th>
              <th className="px-4 py-2 text-left font-semibold">Cubicacion</th>
              <th className="px-4 py-2 text-left font-semibold">Precio m3</th>
              <th className="px-4 py-2 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((item) => (
              <tr key={item.id} className="hover:bg-surface-2/50 align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold text-text">{item.nombre}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {formatStrategy(item.estrategia_precio)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      "badge " +
                      (item.permite_cubicacion
                        ? "badge-success"
                        : "badge-danger")
                    }
                  >
                    {item.permite_cubicacion ? "si" : "no"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">
                    Min: {fmtCurrency(item.min_precio_m3)}
                  </div>
                  <div className="text-xs text-text-subtle mt-1">
                    Max:{" "}
                    {item.max_precio_m3 == null
                      ? "Sin tope"
                      : fmtCurrency(item.max_precio_m3)}
                  </div>
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
            ))}
          </tbody>
        </table>
      </DataTableShell>
    </>
  );
}
