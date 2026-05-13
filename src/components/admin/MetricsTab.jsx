import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { metricsAPI } from "@/services/metrics";

// ─── Paleta coherente con el resto del panel ─────────────────────────────────
const COLORS = {
  primary: "#4a7c59",
  accent: "#d4a843",
  danger: "#c0392b",
  info: "#2980b9",
  muted: "#8c9e8c",
  surface: "#f9f7f4",
  border: "#e2ddd6",
};

const PIE_COLORS = [COLORS.accent, COLORS.primary, COLORS.danger];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const fmtNum = (n) => new Intl.NumberFormat("es-CO").format(n);

// ─── Componentes menores ──────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = COLORS.primary, trend }) {
  return (
    <div
      className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {trend !== undefined && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: trend >= 0 ? "#e8f5e9" : "#fdecea",
              color: trend >= 0 ? "#2e7d32" : "#c0392b",
            }}
          >
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-0.5">
          {label}
        </p>
        <p className="font-display font-black text-2xl" style={{ color }}>
          {value}
        </p>
        {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="font-display font-bold text-lg text-primary mt-8 mb-4 flex items-center gap-2">
      <span
        className="inline-block w-1 h-5 rounded-full"
        style={{ background: COLORS.accent }}
      />
      {children}
    </h3>
  );
}

function ChartCard({ title, children, className = "" }) {
  return (
    <div
      className={`bg-white border border-border rounded-2xl p-5 shadow-sm ${className}`}
    >
      <p className="text-sm font-semibold text-text-muted mb-4">{title}</p>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label, currency = false }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg px-4 py-3 text-sm">
      {label && <p className="font-semibold text-text mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}:{" "}
          <span className="font-bold">
            {currency ? fmt(p.value) : fmtNum(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Hook para datos reales del backend ──────────────────────────────────────
function useRealMetrics(notify) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await metricsAPI.dashboard();
      setData({
        ventasMes: result.ventas_mes,
        ventasMesAnterior: result.ventas_mes_anterior,
        cotizacionesPendientes: result.cotizaciones_pendientes,
        cotizacionesAprobadas: result.cotizaciones_aprobadas,
        cotizacionesRechazadas: result.cotizaciones_rechazadas,
        productosTotal: result.productos_total,
        productosStockBajo: result.productos_stock_bajo,
        clientesTotal: result.clientes_total,
        clientesNuevosMes: result.clientes_nuevos_mes,
        usuariosActivos: result.usuarios_activos,
        ventasMensuales: result.ventas_mensuales,
        cotizacionesMensuales: result.cotizaciones_mensuales,
        clientesMensuales: result.clientes_mensuales,
        topProductos: result.top_productos,
      });
    } catch (err) {
      setError(err.message);
      if (notify) notify(err.message || "Error al cargar métricas", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MetricsTab({ notify }) {
  const { data, loading, error, reload } = useRealMetrics(notify);

  if (loading) {
    return (
      <div className="bg-white border border-border rounded-2xl p-8 text-text-subtle animate-pulse">
        Cargando métricas…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-border rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-text-muted mb-4">
          {error || "No se pudieron cargar las métricas."}
        </p>
        <button type="button" className="btn btn-primary" onClick={reload}>
          Reintentar
        </button>
      </div>
    );
  }

  const trendVentas =
    data.ventasMesAnterior > 0
      ? Math.round(
          ((data.ventasMes - data.ventasMesAnterior) / data.ventasMesAnterior) * 100,
        )
      : 0;

  const totalCotizaciones =
    data.cotizacionesPendientes +
    data.cotizacionesAprobadas +
    data.cotizacionesRechazadas;

  const pieCotizaciones = [
    { name: "Pendientes", value: data.cotizacionesPendientes },
    { name: "Aprobadas", value: data.cotizacionesAprobadas },
    { name: "Rechazadas", value: data.cotizacionesRechazadas },
  ];

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>
          ↻ Actualizar
        </button>
      </div>

      {/* ── KPIs ── */}
      <SectionTitle>Resumen general</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          icon="💰"
          label="Ventas este mes"
          value={fmt(data.ventasMes)}
          sub={`Mes anterior: ${fmt(data.ventasMesAnterior)}`}
          color={COLORS.primary}
          trend={trendVentas}
        />
        <KpiCard
          icon="📋"
          label="Cotizaciones activas"
          value={fmtNum(data.cotizacionesPendientes)}
          sub={`${totalCotizaciones} totales este mes`}
          color={COLORS.accent}
        />
        <KpiCard
          icon="📦"
          label="Piezas en inventario"
          value={fmtNum(data.productosTotal)}
          sub={
            data.productosStockBajo > 0
              ? `⚠️ ${data.productosStockBajo} sin stock`
              : "Stock OK"
          }
          color={data.productosStockBajo > 0 ? COLORS.danger : COLORS.primary}
        />
        <KpiCard
          icon="👥"
          label="Clientes registrados"
          value={fmtNum(data.clientesTotal)}
          sub={`+${data.clientesNuevosMes} nuevos este mes`}
          color={COLORS.info}
          trend={
            data.clientesTotal > 0
              ? Math.round((data.clientesNuevosMes / data.clientesTotal) * 100)
              : 0
          }
        />
        <KpiCard
          icon="🔑"
          label="Usuarios activos"
          value={fmtNum(data.usuariosActivos)}
          sub={`${fmtNum(data.clientesTotal)} clientes registrados`}
          color={COLORS.muted}
        />
      </div>

      {/* ── Gráficas de ventas ── */}
      <SectionTitle>Ventas & Cotizaciones</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Ingresos mensuales (últimos 6 meses)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.ventasMensuales}>
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#8c9e8c" }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
                tick={{ fontSize: 11, fill: "#8c9e8c" }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<CustomTooltip currency />} />
              <Line
                type="monotone"
                dataKey="ventas"
                name="Ventas"
                stroke={COLORS.primary}
                strokeWidth={2.5}
                dot={{ r: 4, fill: COLORS.primary }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cotizaciones por estado (últimos 6 meses)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.cotizacionesMensuales} barSize={10}>
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#8c9e8c" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8c9e8c" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
              <Bar dataKey="aprobadas" name="Aprobadas" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="pendientes" name="Pendientes" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
              <Bar dataKey="rechazadas" name="Rechazadas" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Distribución + Top productos ── */}
      <SectionTitle>Inventario & Productos</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Distribución de cotizaciones">
          {totalCotizaciones === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">
              Sin cotizaciones este mes
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieCotizaciones} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieCotizaciones.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [fmtNum(value), name]} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top tipos de madera más cotizados (6 meses)" className="lg:col-span-2">
          {data.topProductos.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">
              Sin datos de cotizaciones en los últimos 6 meses
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.topProductos} layout="vertical" barSize={12} margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "#8c9e8c" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: "#555" }} axisLine={false} tickLine={false} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cotizaciones" name="Cotizaciones" fill={COLORS.accent} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Crecimiento de clientes ── */}
      <SectionTitle>Clientes</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Nuevos clientes por mes">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.clientesMensuales} barSize={32}>
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#8c9e8c" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8c9e8c" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="nuevos" name="Nuevos clientes" fill={COLORS.info} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-semibold text-text-muted mb-4">
            Estado del inventario
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text">Piezas disponibles</span>
              <span className="font-bold text-primary">{fmtNum(data.productosTotal)}</span>
            </div>
            {data.productosTotal > 0 && (
              <div className="w-full bg-surface rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.round(((data.productosTotal - data.productosStockBajo) / data.productosTotal) * 100)}%`,
                    background: COLORS.primary,
                  }}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text">Con stock</span>
              <span className="font-bold" style={{ color: COLORS.primary }}>
                {fmtNum(data.productosTotal - data.productosStockBajo)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text flex items-center gap-1">⚠️ Sin stock</span>
              <span className="font-bold" style={{ color: COLORS.danger }}>
                {fmtNum(data.productosStockBajo)}
              </span>
            </div>
            {data.productosStockBajo > 0 && (
              <div className="mt-2 rounded-xl px-4 py-3 text-sm" style={{ background: "#fdecea", color: COLORS.danger }}>
                {data.productosStockBajo} pieza{data.productosStockBajo > 1 ? "s" : ""} sin stock disponible. Revisa el módulo de Inventario.
              </div>
            )}
            {data.productosTotal === 0 && (
              <div className="mt-2 rounded-xl px-4 py-3 text-sm" style={{ background: "#fff8e1", color: "#b45309" }}>
                No hay piezas registradas en inventario.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
