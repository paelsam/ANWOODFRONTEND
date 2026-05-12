import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { usersAPI } from "@/services/users";
import DataTableShell from "@/components/admin/DataTableShell";
import Modal from "@/components/admin/Modal";

export default function UsersTab({ notify }) {
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
                  <td className="px-4 py-2 text-text-subtle">
                    {u.email || "—"}
                  </td>
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
