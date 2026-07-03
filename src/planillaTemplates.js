// Plantillas de las planillas imprimibles. Son listas fijas: no se guardan en
// Firestore, solo definen qué campos mostrar. Lo que sí se guarda en Firestore
// son los VALORES que carga el usuario para cada item, asociados a un presupuesto.

export const PLANILLA_A_NUMBER_SECTIONS = [
  {
    key: "herramientas",
    title: "Herramientas",
    items: [
      "Cocteleras", "Pinzas frutas", "Pinzas precisión", "Cuchara larga bar", "Pisones",
      "Exprimidor", "Jigger", "Zester", "Descorazonador de ananá", "Destapador común",
      "Picos", "Destapador 2 tiempos", "Cuchillos serruchos", "Destapador champagne", "Abrelata",
      "Cucharones", "Saleros", "Organizadores", "Cubos sorbetes", "Caños barras nuevas",
      "Motores", "Jarras licuadoras", "Tanques azules", "Palas chicas", "Martillo",
      "Embudos", "Tabla de cortar", "Tapper para ananás", "Tappers tapa azul",
    ],
  },
  {
    key: "bitter",
    title: "Bitter",
    items: ["Rosa", "Jengibre", "Albaca", "Menta", "Angostura", "Albumina", "Perfumes"],
  },
  {
    key: "cristaleria",
    title: "Cristalería",
    items: [
      "Vasos Toc Toc", "Vasos whisky", "Tanques de vidrio grandes", "Frascos decoración",
      "Frascos hexagonales", "Botellas almíbar", "Botellas de jugo", "Botellas chicas", "Vasos de refrescado",
    ],
  },
  {
    key: "limpieza",
    title: "Limpieza",
    items: [
      "Secador de piso", "Trapos de piso", "Esponjas", "Detergente", "Repasadores",
      "Trapos limpieza barra", "Brumizador", "Bolsas", "Baldes", "Botiquín",
      "Tachos de basura", "Rejilla", "Raid", "Espirales",
    ],
  },
];

export const PLANILLA_A_CHECKLIST_SECTION = {
  key: "observaciones",
  title: "Checklist de observaciones",
  items: [
    "Cartas de tragos", "Tarjetas", "Marco/QR", "Descartables", "Sorbetes",
    "Vasos Hexagonales", "Copas", "Vasos Gota", "Frascos", "Luces",
    "Racks", "Bar Mat", "Estirillas", "Hielo Rulo", "Picado",
  ],
};

export const PLANILLA_B_BEBIDAS = {
  key: "bebidas",
  title: "Bebidas",
  columns: [
    { key: "marca", label: "Marca" },
    { key: "solicitado", label: "Solicitado evento" },
    { key: "abiertoInicio", label: "Abierto inicio" },
    { key: "stockFinal", label: "Stock final" },
    { key: "stockAbierto", label: "Stock abierto" },
  ],
  items: [
    "Martini Dry", "Aperol", "Martini Bianco", "Esperidina", "Rosso", "Fernet", "Americano",
    "Campari", "Pineral/Terma", "Ron", "Tequila", "Vodka", "Whisky", "Cynar", "Gin",
    "Licor Menta", "Licor Durazno", "Granadina", "Piña Colada", "Tanques de agua",
  ],
};

export const PLANILLA_B_JUGOS = {
  key: "jugos",
  title: "Jugos, pulpas, almíbares y gaseosas",
  columns: [
    { key: "marca", label: "Marca" },
    { key: "cantidad", label: "Cantidad" },
  ],
  items: [
    "Jugo Limón Botella", "Jugo Limón Tang", "Jugo Manzana Tang", "Jugo Mandarina Clight",
    "Pulpa Frutilla Bahía", "Pulpa Maracuyá Bahía", "Pulpa Ananá lata Bahía", "Té Jengibre",
    "Almíbar", "Almíbar Peperina", "Almíbar Simple", "Almíbar Romero", "Pomelo Roció",
    "Tónica Roció", "Soda Druetta", "Cola Coca C", "Jugo Preparado Limón", "Jugo Preparado Naranja",
  ],
};

export const PLANILLA_B_FRUTAS = {
  key: "frutasVarios",
  title: "Frutas, cervezas y varios",
  columns: [
    { key: "inicial", label: "Cantidad inicial" },
    { key: "final", label: "Cantidad final" },
  ],
  items: [
    "Hierba Buena", "Pomelos", "Pepinos", "Frutillas", "Limones", "Limas", "Piñas",
    "Naranjas", "Manzanas", "Schneider lata", "Corona botella", "Stella Artois",
    "Vino caja x6", "Agua 500 P", "Agua 1 L P", "Speed Pack",
  ],
};

export const PLANILLA_B_TABLE_SECTIONS = [PLANILLA_B_BEBIDAS, PLANILLA_B_JUGOS, PLANILLA_B_FRUTAS];
