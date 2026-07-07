// Listas fijas de la Planilla de Cierre de Evento (Parte de Faltantes/Consumo).
// Son solo listas de nombres: no se guardan en Firestore, definen qué renglones
// mostrar. Lo que se guarda en Firestore es la cantidad faltante cargada por el
// usuario para cada uno (y, opcionalmente, a qué producto real de Stock corresponde).

export const PLANILLA_BEBIDAS = [
  "Martini Dry", "Aperol", "Martini Bianco", "Esperidina", "Rosso", "Fernet", "Americano",
  "Campari", "Pineral/Terma", "Ron", "Tequila", "Vodka", "Whisky", "Cynar", "Gin",
  "Licor Menta", "Licor Durazno", "Granadina", "Piña Colada", "Tanques de agua",
];

export const PLANILLA_JUGOS = [
  "Jugo Limón Botella", "Jugo Limón Tang", "Jugo Manzana Tang", "Jugo Mandarina Clight",
  "Pulpa Frutilla Bahía", "Pulpa Maracuyá Bahía", "Pulpa Ananá lata Bahía", "Té Jengibre",
  "Almíbar", "Almíbar Peperina", "Almíbar Simple", "Almíbar Romero", "Pomelo Roció",
  "Tónica Roció", "Soda Druetta", "Cola Coca C", "Jugo Preparado Limón", "Jugo Preparado Naranja",
];

export const PLANILLA_FRUTAS_VARIOS = [
  "Hierba Buena", "Pomelos", "Pepinos", "Frutillas", "Limones", "Limas", "Piñas",
  "Naranjas", "Manzanas", "Schneider lata", "Corona botella", "Stella Artois",
  "Vino caja x6", "Agua 500 P", "Agua 1 L P", "Speed Pack",
];

export const PLANILLA_CRISTALERIA = [
  "Vasos Toc Toc", "Vasos whisky", "Tanques de vidrio grandes", "Frascos decoración",
  "Frascos hexagonales", "Botellas almíbar", "Botellas de jugo", "Botellas chicas", "Vasos de refrescado",
];
