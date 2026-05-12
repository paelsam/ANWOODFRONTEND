import { useCallback, useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { configurationAPI } from "@/services/configuration";
import DataTableShell from "@/components/admin/DataTableShell";
import Modal from "@/components/admin/Modal";

export default function ConfigurationTab({ notify }) {
  const [configurations, setConfigurations] = useState([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ clave: "", valor: "", descripcion: "" });
  const [editForm, setEditForm] = useState({ clave: "", valor: "", descripcion: "" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await configurationAPI.list();
      setConfigurations(list || []);
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
      if (!form.clave) {
        notify("La clave es obligatoria", "error");
        return;
      }
      const payload = {
        clave: form.clave,
        valor: form.valor,
        descripcion: form.descripcion || null,
      };
      await configurationAPI.create(payload);
      notify("Configuración creada");
      setModal(false);
      setForm({ clave: "", valor: "", descripcion: "" });
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setEditForm({ clave: c.clave || "", valor: c.valor || "", descripcion: c.descripcion || "" });
    setEditModal(true);
  };

  const updateConfig = async () => {
    try {
      if (!editForm.clave) {
        notify("La clave es obligatoria", "error");
        return;
      }
      const payload = {
        clave: editForm.clave,
        valor: editForm.valor,
        descripcion: editForm.descripcion || null,
      };
      await configurationAPI.update(editingId, payload);
      notify("Configuración actualizada");
      setEditModal(false);
      setEditingId(null);
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const removeConfig = async (c) => {
    const confirmed = window.confirm(
      `Eliminar la configuración "${c.clave}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    try {
      await configurationAPI.remove(c.id);
      notify("Configuración eliminada");
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  return (
    <>
      {modal && (
        <Modal title="Nueva configuración" onClose={() => setModal(false)}>
          {[
            ["clave", "Clave", "text"],
            ["valor", "Valor", "text"],
          ].map(([field, label, type]) => (
            <div className="form-group" key={field}>
              <label className="form-label">{label}</label>
              <input
                type={type}
                className="form-input"
                value={form[field]}
                onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
              />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-input"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={save}>
              Crear
            </button>
          </div>
        </Modal>
      )}

      {editModal && (
        <Modal title="Actualizar configuración" onClose={() => setEditModal(false)}>
          {[
            ["clave", "Clave", "text"],
            ["valor", "Valor", "text"],
          ].map(([field, label, type]) => (
            <div className="form-group" key={field}>
              <label className="form-label">{label}</label>
              <input
                type={type}
                className="form-input"
                value={editForm[field]}
                onChange={(e) => setEditForm((prev) => ({ ...prev, [field]: e.target.value }))}
              />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-input"
              value={editForm.descripcion}
              onChange={(e) => setEditForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="btn btn-ghost" onClick={() => setEditModal(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={updateConfig}>
              Guardar cambios
            </button>
          </div>
        </Modal>
      )}

      <DataTableShell
        title="Configuraciones"
        count={configurations.length}
        action={
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setModal(true)}>
            <Plus size={14} /> Nueva configuración
          </button>
        }
      >
        {loading ? (
          <div className="p-8 text-text-subtle">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Clave</th>
                <th className="px-4 py-2 text-left font-semibold">Valor</th>
                <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                <th className="px-4 py-2 text-left font-semibold">Actualizado</th>
                <th className="px-4 py-2 text-left font-semibold">Actualizado por</th>
                <th className="px-4 py-2 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {configurations.map((c) => (
                <tr key={c.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-2 font-medium">{c.clave}</td>
                  <td className="px-4 py-2">{c.valor}</td>
                  <td className="px-4 py-2 text-text-subtle">{c.descripcion || "—"}</td>
                  <td className="px-4 py-2">{c.updated_at ? new Date(c.updated_at).toLocaleString() : "—"}</td>
                  <td className="px-4 py-2">{c.updated_by_nombre ?? "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>
                        <Edit2 size={14} />
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => removeConfig(c)}>
                        <Trash2 size={14} />
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
