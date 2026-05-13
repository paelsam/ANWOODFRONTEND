export const categoryFixture = {
  id: 10,
  nombre: "Estructural",
  estrategia_precio: "precio_por_metro",
  permite_cubicacion: true,
  min_precio_m3: 1500000,
  max_precio_m3: 2500000,
};

export const categoryStringFixture = "Premium";

export const woodTypeFixture = {
  id: 20,
  nombre: "Cedro",
  descripcion: "Madera resistente para exteriores.",
  categoria: categoryFixture,
  categoria_id: categoryFixture.id,
  densidad_kg_m3: 420,
  precio_por_metro: 65000,
  activo: true,
  imagenes: ["https://cdn.test/cedro.png"],
};

export const measureFixture = {
  id: 30,
  etiqueta: '2" x 4"',
  ancho_in: 2,
  alto_in: 4,
};

export const pieceFixture = {
  id: 40,
  tipo_madera: woodTypeFixture,
  tipo_madera_id: woodTypeFixture.id,
  medida: measureFixture,
  medida_id: measureFixture.id,
  largo_m: 3.2,
  cantidad: 8,
  stock: 6,
  cantidad_reservada: 2,
  volumen_m3: 0.032,
  precio_unitario: 120000,
  costo_unitario: 80000,
  estado: "disponible",
  lote_id: 9,
};

export const cartItemFixture = {
  id: 50,
  pieceId: pieceFixture.id,
  woodName: "Cedro",
  emoji: "🌲",
  tipo_madera_id: woodTypeFixture.id,
  medida_id: measureFixture.id,
  largo_m: 3.2,
  ancho_in: 2,
  alto_in: 4,
  volumen_m3: 0.032,
  price: 120000,
  qty: 2,
  total_price: 240000,
  stock: 6,
};

export const cartSummaryFixture = {
  items: [
    {
      id: 101,
      wood_piece_id: pieceFixture.id,
      cantidad: 2,
      added_at: "2026-05-01T00:00:00Z",
    },
  ],
};

export const userFixture = {
  id: 60,
  username: "cliente01",
  full_name: "Cliente Uno",
  email: "cliente@example.com",
  phone: "3000000000",
  role: "user",
  role_id: 3,
  disabled: false,
};

export const adminUserFixture = {
  ...userFixture,
  id: 61,
  username: "admin01",
  full_name: "Admin Uno",
  role: "admin",
  role_id: 1,
};

export const staffUserFixture = {
  ...userFixture,
  id: 62,
  username: "staff01",
  full_name: "Staff Uno",
  role: "staff",
};

export const clientFixture = {
  id: 70,
  usuario_id: userFixture.id,
  tipo_cliente: "empresa",
  nombre_razon_social: "Maderas del Pacífico SAS",
  identificacion_fiscal: "900123456",
  email: "compras@pacifico.test",
  telefono: "3111111111",
  direccion: "Buenaventura",
  activo: true,
};

export const quotationDetailFixture = {
  id: 80,
  tipo_madera: woodTypeFixture,
  medida: measureFixture,
  largo_m: 3.2,
  cantidad: 2,
  regla_calculo: "precio_por_metro",
  volumen_m3: 0.064,
  subtotal: 240000,
};

export const quotationFixture = {
  id: 90,
  cliente_id: clientFixture.id,
  fecha_creacion: "2026-05-01T00:00:00Z",
  detalles: [quotationDetailFixture],
  subtotal_madera: 240000,
  total_transporte: 50000,
  total_salvoconducto: 10000,
  total: 300000,
  monto_anticipo: 300000,
  estado: "borrador",
};
