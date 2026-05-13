import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { clientsAPI } from "@/services/clients";
import { usersAPI } from "@/services/users";
import DataTableShell from "@/components/admin/DataTableShell";
import Modal from "@/components/admin/Modal";

export default function ClientsTab({ notify }) {
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
        notify(
          "Completa usuario, tipo, razón social e identificación.",
          "error",
        );
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
