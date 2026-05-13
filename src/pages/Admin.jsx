import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { inventoryAPI } from "@/services/inventory";
import CategoriesTab from "@/components/admin/CategoriesTab";
import InventoryTab from "@/components/admin/InventoryTab";
import QuotationsTab from "@/components/admin/QuotationsTab";
import UsersTab from "@/components/admin/UsersTab";
import WoodTypesTab from "@/components/admin/WoodTypesTab";
import ConfigurationTab from "@/components/admin/ConfigurationTab";
import MetricsTab from "@/components/admin/MetricsTab";
 
export default function Admin() {
  const { user, notify, setPage, token } = useApp();
 
  const [tab, setTab] = useState("metrics");
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

  const canAccess = user?.role === "admin" || user?.role === "staff";

  useEffect(() => {
    if (canAccess) {
      reloadWoodData();
    }
  }, [canAccess, reloadWoodData]);

  if (!user || !canAccess) {
    return (
      <div className="text-center py-20 px-6">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="font-display font-bold text-3xl text-text mb-3">
          Acceso restringido
        </h2>
        <p className="text-text-muted mb-6">
          Debes iniciar sesión como administrador o staff.
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
  { id: "metrics",       label: "Métricas",        icon: "📊" },
  { id: "inventory",     label: "Inventario",       icon: "📦" },
  { id: "categories",    label: "Categorías",       icon: "🏷️" },
  { id: "woodtypes",     label: "Tipos de madera",  icon: "🪵" },
  // separador automático antes de "quotations"
  { id: "quotations",    label: "Cotizaciones",     icon: "🧾" },
  { id: "users",         label: "Usuarios",         icon: "👤" },
  // separador automático antes de "configuration"
  { id: "configuration", label: "Configuración",    icon: "⚙️" },
];
 
  return (
  <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
    {/* Header */}
    <div className="mb-8">
      <h1 className="font-display font-black text-3xl md:text-4xl text-primary">
        Panel <span className="text-accent">Administrativo</span>
      </h1>
      <p className="text-sm text-text-muted mt-2">
        Gestión de inventario, clientes, cotizaciones y usuarios.
      </p>
    </div>

    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* ── Sidebar de tabs ── */}
      <nav className="w-full md:w-52 shrink-0 bg-white border border-border rounded-2xl p-2 flex flex-col gap-0.5">
        <p className="text-[11px] font-medium text-text-subtle uppercase tracking-widest px-2.5 py-2">
          Panel admin
        </p>

        {tabs.map((item, i) => (
          <>
            {/* Separador antes de "Cotizaciones" y "Configuración" */}
            {(item.id === "quotations" || item.id === "configuration") && (
              <div key={`sep-${item.id}`} className="h-px bg-border my-1" />
            )}
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={
                "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition cursor-pointer w-full text-left " +
                (tab === item.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-text-muted hover:bg-surface hover:text-text")
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          </>
        ))}
      </nav>

      {/* ── Contenido ── */}
      <div className="flex-1 min-w-0">
        {supportLoading ? (
          <div className="bg-white border border-border rounded-2xl p-8 text-text-subtle">
            Cargando catálogos del panel…
          </div>
        ) : (
          <>
            {tab === "metrics"       && <MetricsTab       notify={notify} token={token} />}
            {tab === "inventory"     && <InventoryTab      notify={notify} woodTypes={woodTypes} measures={measures} />}
            {tab === "categories"    && <CategoriesTab     notify={notify} categories={categories} reloadWoodData={reloadWoodData} />}
            {tab === "woodtypes"     && <WoodTypesTab      notify={notify} woodTypes={woodTypes} categories={categories} reloadWoodData={reloadWoodData} />}
            {tab === "quotations"    && <QuotationsTab     notify={notify} />}
            {tab === "users"         && <UsersTab          notify={notify} />}
            {tab === "configuration" && <ConfigurationTab  notify={notify} />}
          </>
        )}
      </div>
    </div>
  </div>
);
}