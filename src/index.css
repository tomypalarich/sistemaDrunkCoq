@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: "Inter", sans-serif;
}

.font-display {
  font-family: "Playfair Display", serif;
}

/* Al imprimir (o "Guardar como PDF"), ocultamos toda la interfaz de la app
   y dejamos ver solo el contenido marcado con id="printable-planilla". */
@media print {
  body * {
    visibility: hidden;
  }
  #printable-planilla,
  #printable-planilla * {
    visibility: visible;
  }
  #printable-planilla {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .no-print {
    display: none !important;
  }
}
