export const DEFAULT_STOCK_CATEGORIES = ["Mobiliario", "Iluminación", "Vajilla", "Decoración", "Sonido", "Textil"];
export const DEFAULT_PROVIDER_CATEGORIES = ["Catering", "Sonido", "Ambientación", "Fotografía", "Mobiliario", "Flores", "Iluminación"];
export const TIPOS_EVENTO = ["Casamiento", "Cumpleaños 15", "Evento Corporativo", "Cumpleaños Infantil", "Aniversario", "Otro"];
export const ESTADOS = ["Pendiente", "Aprobado", "Rechazado", "Finalizado"];

export const mockProducts = [
  { name: "Mantel blanco redondo", category: "Textil", stock: 85, minAlert: 20, costPrice: 3500, salePrice: 6000, providerMockId: "v1" },
  { name: "Mantel negro rectangular", category: "Textil", stock: 12, minAlert: 15, costPrice: 3800, salePrice: 6500, providerMockId: "v1" },
  { name: "Silla Tiffany dorada", category: "Mobiliario", stock: 150, minAlert: 40, costPrice: 4200, salePrice: 7500, providerMockId: "v7" },
  { name: "Silla Chiavari blanca", category: "Mobiliario", stock: 30, minAlert: 30, costPrice: 4500, salePrice: 8000, providerMockId: "v7" },
  { name: "Set de luces LED RGB", category: "Iluminación", stock: 8, minAlert: 10, costPrice: 22000, salePrice: 38000, providerMockId: "v4" },
  { name: "Reflector de pista", category: "Iluminación", stock: 22, minAlert: 6, costPrice: 15000, salePrice: 26000, providerMockId: "v4" },
  { name: "Vajilla porcelana (x10)", category: "Vajilla", stock: 40, minAlert: 15, costPrice: 9000, salePrice: 15000, providerMockId: "v1" },
  { name: "Copas de cristal", category: "Vajilla", stock: 200, minAlert: 50, costPrice: 1200, salePrice: 2200, providerMockId: "v1" },
  { name: "Equipo de sonido portátil", category: "Sonido", stock: 5, minAlert: 4, costPrice: 85000, salePrice: 140000, providerMockId: "v2" },
  { name: "Micrófono inalámbrico", category: "Sonido", stock: 9, minAlert: 10, costPrice: 18000, salePrice: 32000, providerMockId: "v2" },
  { name: "Centro de mesa floral", category: "Decoración", stock: 18, minAlert: 20, costPrice: 6500, salePrice: 11000, providerMockId: "v3" },
  { name: "Cortina de luces", category: "Decoración", stock: 33, minAlert: 10, costPrice: 8500, salePrice: 14500, providerMockId: "v4" },
];

export const mockProviders = [
  { mockId: "v1", name: "Sabores del Sur", category: "Catering", locality: "Córdoba Capital" },
  { mockId: "v2", name: "DJ Martín Ruiz", category: "Sonido", locality: "Villa Carlos Paz" },
  { mockId: "v3", name: "Flores & Diseño", category: "Flores", locality: "Córdoba Capital" },
  { mockId: "v4", name: "Luminotecnia Estudio", category: "Iluminación", locality: "Córdoba Capital" },
  { mockId: "v5", name: "Ambientaciones Real", category: "Ambientación", locality: "Río Cuarto" },
  { mockId: "v6", name: "Lente Vivo Fotografía", category: "Fotografía", locality: "Córdoba Capital" },
  { mockId: "v7", name: "Mobiliario Elegance", category: "Mobiliario", locality: "Córdoba Capital" },
];

// providerIds y contactProviderId usan los mockId de arriba; el seed los traduce
// a los ids reales que Firestore genera al crear cada proveedor.
export const mockBudgets = [
  { eventType: "Casamiento", guests: 180, venue: "Salón Las Acacias", locality: "Córdoba Capital", date: "2026-09-12", contact: "Lucía Fernández", phone: "351 555 0142", providerIds: ["v1", "v4"], contactProviderId: "v1", status: "Aprobado", barType: "Barra libre premium", baseAmount: 1800000, extras: [{ name: "Máquina Jägermeister", price: 90000 }, { name: "Carrito de tragos", price: 60000 }] },
  { eventType: "Cumpleaños 15", guests: 120, venue: "Quinta El Mirador", locality: "Río Cuarto", date: "2026-08-03", contact: "Martina Gómez", phone: "358 555 0299", providerIds: ["v2"], contactProviderId: "v2", status: "Pendiente", barType: "Barra de tragos sin alcohol", baseAmount: 650000, extras: [{ name: "Máquina de algodón de azúcar", price: 35000 }] },
  { eventType: "Evento Corporativo", guests: 60, venue: "Hotel Amerian", locality: "Córdoba Capital", date: "2026-07-20", contact: "Carlos Pereyra", phone: "351 555 0411", providerIds: ["v6"], contactProviderId: "v6", status: "Finalizado", barType: "Barra de café y bebidas", baseAmount: 320000, extras: [] },
  { eventType: "Aniversario", guests: 40, venue: "Salón Jardín Sur", locality: "Villa Carlos Paz", date: "2026-10-05", contact: "Ana Torres", phone: "351 555 0876", providerIds: ["v3"], contactProviderId: "", status: "Rechazado", barType: "Barra de vinos", baseAmount: 280000, extras: [] },
  { eventType: "Cumpleaños Infantil", guests: 50, venue: "Salón KidsParty", locality: "Córdoba Capital", date: "2026-07-28", contact: "Diego López", phone: "351 555 0653", providerIds: ["v5", "v3"], contactProviderId: "v5", status: "Pendiente", barType: "Barra de jugos y gaseosas", baseAmount: 210000, extras: [{ name: "Carrito de golosinas", price: 40000 }] },
  { eventType: "Casamiento", guests: 220, venue: "Estancia La Candelaria", locality: "Córdoba Capital", date: "2026-11-15", contact: "Sofía Medina", phone: "351 555 0987", providerIds: ["v7", "v1", "v4"], contactProviderId: "v7", status: "Aprobado", barType: "Barra libre premium", baseAmount: 2100000, extras: [{ name: "Máquina Jägermeister", price: 90000 }, { name: "Barra de tragos molecular", price: 150000 }] },
];

export const mockMovements = [
  "Se agregaron 20 manteles blancos redondos",
  "Se redujeron 5 sets de luces LED RGB",
  "Se agregaron 10 sillas Chiavari blancas",
  "Se redujeron 3 micrófonos inalámbricos",
  "Se agregaron 15 copas de cristal",
];
