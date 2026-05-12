import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { inventoryAPI } from "@/services/inventory";
import ClientsTab from "@/components/admin/ClientsTab";
import InventoryTab from "@/components/admin/InventoryTab";
import QuotationsTab from "@/components/admin/QuotationsTab";
import UsersTab from "@/components/admin/UsersTab";
import WoodTypesTab from "@/components/admin/WoodTypesTab";

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
