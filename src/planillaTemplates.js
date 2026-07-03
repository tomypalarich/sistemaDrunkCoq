// Plantillas de las planillas imprimibles, basadas en los documentos Word
// reales que usa DrunkCoq ("Logistica Herramientas" y "Logistica Mercadería").
// Son listas fijas: no se guardan en Firestore, solo definen qué campos
// mostrar. Lo que sí se guarda en Firestore son los VALORES que carga el
// usuario para cada item, asociados a un presupuesto.

// Casilleros del encabezado: E = Entrega, A = Armado, D = Devolución.
// La planilla de Mercadería no tiene "D" porque lo que se entrega se consume,
// no se devuelve.
export const PLANILLA_A_HEADER_CHECKS = [
  { key: "E", label: "Entrega" },
  { key: "A", label: "Armado" },
  { key: "D", label: "Devolución" },
];

export const PLANILLA_B_HEADER_CHECKS = [
  { key: "E", label: "Entrega" },
  { key: "A", label: "Armado" },
];

/* ----------------------------- PLANILLA A ----------------------------- */

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

// En el documento original esto es una lista de renglones en blanco para
// completar a mano (una línea de puntos después de cada palabra), no
// casilleros para tildar. Por eso acá es un campo de texto libre por ítem.
export const PLANILLA_A_LINE_SECTION = {
  key: "observaciones",
  title: "Observaciones",
  items: [
    "Cartas de tragos", "Tarjetas", "Marco/QR", "Descartables", "Sorbetes",
    "Vasos Hexagonales", "Copas", "Vasos Gota", "Frascos", "Luces",
    "Racks", "Bar Mat", "Estirillas", "Hielo Rulo", "Picado",
  ],
};

/* ----------------------------- PLANILLA B ----------------------------- */

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

// Estas dos secciones tienen una "marca" fija impresa junto al nombre
// (parte de la plantilla, no la carga el usuario), y solo la cantidad se
// completa. Como puede haber dos ítems con el mismo nombre+marca (pasa en
// el documento real, ej. "Jugo Manzana / Tang" aparece dos veces), cada
// ítem se identifica por su POSICIÓN en la lista, no por el nombre.
export const PLANILLA_B_JUGOS_PULPAS = {
  key: "jugosPulpas",
  title: "Jugos y pulpas",
  items: [
    { label: "Jugo Limón", marca: "Botella" },
    { label: "Jugo Limón", marca: "Tang" },
    { label: "Jugo Manzana", marca: "Tang" },
    { label: "Jugo Manzana", marca: "Tang" },
    { label: "Jugo Mandarina", marca: "Clight" },
    { label: "Pulpa de Frutilla", marca: "Bahía" },
    { label: "Pulpa Maracuyá", marca: "Bahía" },
    { label: "Pulpa Ananá lata", marca: "Bahía" },
  ],
};

export const PLANILLA_B_ALMIBARES = {
  key: "almibares",
  title: "Almíbares",
  items: ["Té Jengibre", "Almíbar", "Almíbar Peperina", "Almíbar Simple", "Almíbar Romero"],
};

export const PLANILLA_B_GASEOSAS = {
  key: "gaseosas",
  title: "Gaseosas",
  items: [
    { label: "Pomelo", marca: "Roció" },
    { label: "Tónica", marca: "Roció" },
    { label: "Soda", marca: "Druetta" },
    { label: "Cola", marca: "Coca C" },
  ],
};

export const PLANILLA_B_JUGO_PREPARADO = {
  key: "jugoPreparado",
  title: "Jugo preparado",
  items: ["Limón", "Naranja"],
};

// Tablas con cantidad inicial/final, tal como en el documento original.
export const PLANILLA_B_FRUTAS = {
  key: "frutas",
  title: "Frutas",
  columns: [
    { key: "inicial", label: "Cantidad inicial" },
    { key: "final", label: "Cantidad final" },
  ],
  items: ["Hierba Buena", "Pomelos", "Pepinos", "Frutillas", "Limones", "Limas", "Piñas", "Naranjas", "Manzanas"],
};

export const PLANILLA_B_CERVEZAS = {
  key: "cervezas",
  title: "Cervezas",
  columns: [
    { key: "inicial", label: "Cantidad inicial" },
    { key: "final", label: "Cantidad final" },
  ],
  items: ["Schneider lata", "Corona botella", "Stella Artois"],
};

export const PLANILLA_B_VARIOS = {
  key: "varios",
  title: "Varios",
  columns: [
    { key: "inicial", label: "Cantidad inicial" },
    { key: "final", label: "Cantidad final" },
  ],
  items: ["Vino caja x6", "Agua 500 P", "Agua 1 L P", "Speed Pack"],
};

export const PLANILLA_B_NUMBER_SECTIONS = [PLANILLA_B_ALMIBARES, PLANILLA_B_JUGO_PREPARADO];
export const PLANILLA_B_LABELED_SECTIONS = [PLANILLA_B_JUGOS_PULPAS, PLANILLA_B_GASEOSAS];
export const PLANILLA_B_TABLE_SECTIONS = [PLANILLA_B_BEBIDAS];
export const PLANILLA_B_STOCK_TABLE_SECTIONS = [PLANILLA_B_FRUTAS, PLANILLA_B_CERVEZAS, PLANILLA_B_VARIOS];
