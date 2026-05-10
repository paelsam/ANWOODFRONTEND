import { useCallback, useEffect, useState } from "react";
import { Plus, X, Lock } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { usersAPI } from "@/services/users";

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-border rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
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

function DataTableShell({ title, count, action, children }) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 border-b border-border bg-surface-2">
        <span className="font-display font-bold text-text">
          {title} ({count})
        </span>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function UsersTab({ notify }) {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    role_id: 1,
    password: "",
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

  return (
    <>
      {modal && (
        <Modal title="Nuevo Usuario" onClose={() => setModal(false)}>
          {[
            ["username", "Usuario", "text"],
            ["full_name", "Nombre completo", "text"],
            ["email", "Correo electrónico", "email"],
            ["phone", "Teléfono", "text"],
            ["password", "Contraseña", "password"],
          ].map(([f, label, t]) => (
            <div className="form-group" key={f}>
              <label className="form-label">{label}</label>
              <input
                type={t}
                className="form-input"
                value={form[f]}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [f]: e.target.value }))
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
                setForm((p) => ({ ...p, role_id: e.target.value }))
              }
            >
              <option value={1}>Cliente</option>
              <option value={3}>Administrador</option>
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
              Crear Usuario
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
            <Plus size={14} /> Nuevo Usuario
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-2 font-medium">{u.username}</td>
                  <td className="px-4 py-2">{u.full_name || "—"}</td>
                  <td className="px-4 py-2 text-text-subtle">{u.email}</td>
                  <td className="px-4 py-2 text-text-subtle">
                    {u.phone || "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        "badge " +
                        (u.role_id === 3 ? "badge-warning" : "badge-info")
                      }
                    >
                      {u.role_id === 3 ? "admin" : "client"}
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

  if (!user || user.role !== "admin") {
    return (
      <div className="text-center py-20 px-6">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="font-display font-bold text-3xl text-text mb-3">
          Acceso Restringido
        </h2>
        <p className="text-text-muted mb-6">
          Debes iniciar sesión como administrador.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setPage("login")}
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <h1 className="font-display font-black text-3xl md:text-4xl text-primary">
          Panel <span className="text-accent">de Usuarios</span>
        </h1>
      </div>
      <UsersTab notify={notify} />
    </div>
  );
}
