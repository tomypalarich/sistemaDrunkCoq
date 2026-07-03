# DrunkCoq Eventos

Aplicación web para gestionar el stock, los presupuestos y los proveedores de una empresa de organización de eventos. Hecha con **React + Vite + Tailwind CSS**, con **Firebase Firestore** como base de datos en tiempo real.

---

## 1. Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- Una cuenta de [Firebase](https://firebase.google.com/) (gratuita)
- Una cuenta de [GitHub](https://github.com/)

---

## 2. Crear el proyecto de Firebase

1. Entrá a [console.firebase.google.com](https://console.firebase.google.com/) y creá un proyecto nuevo (podés desactivar Google Analytics, no hace falta).
2. Dentro del proyecto, andá a **Compilación → Firestore Database** y hacé clic en **Crear base de datos**.
   - Elegí la ubicación más cercana (ej: `southamerica-east1`).
   - Empezá en **modo de prueba** (más abajo te paso reglas seguras para producción).
3. Andá a **Configuración del proyecto** (ícono de tuerca, arriba a la izquierda) → pestaña **General** → bajá hasta "Tus apps" → hacé clic en el ícono **`</>`** (Web) para registrar una nueva app web.
4. Ponele un nombre (ej: "DrunkCoq Web") y registrala. Firebase te va a mostrar un bloque `firebaseConfig` con varias claves (`apiKey`, `authDomain`, `projectId`, etc.). **Guardá esos valores**, los vas a necesitar en el paso 4.

---

## 3. Instalar el proyecto en tu computadora

```bash
# Descomprimí el proyecto y entrá a la carpeta
cd drunkcoq-eventos

# Instalá las dependencias
npm install
```

---

## 4. Configurar las credenciales de Firebase

1. Hacé una copia del archivo `.env.example` y renombrala a `.env`:

```bash
cp .env.example .env
```

2. Abrí `.env` y completá cada variable con los valores que te dio Firebase en el paso 2.4:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

> ⚠️ El archivo `.env` **no se sube a GitHub** (ya está excluido en `.gitignore`). Cada persona que use el proyecto debe crear el suyo.

---

## 5. Correr la app en modo desarrollo

```bash
npm run dev
```

Abrí la URL que te muestra la terminal (normalmente `http://localhost:5173`). La primera vez vas a ver un banner para **"Cargar datos de ejemplo"** — tocalo para poblar Firestore con productos, proveedores y presupuestos de muestra. A partir de ahí, todo lo que agregues, edites o borres se guarda en tiempo real en tu base de datos de Firestore.

---

## 6. Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "Primer commit: DrunkCoq Eventos"
```

1. Andá a [github.com/new](https://github.com/new) y creá un repositorio nuevo (vacío, sin README ni .gitignore).
2. Copiá la URL que te da GitHub y conectala con tu proyecto local:

```bash
git remote add origin https://github.com/TU-USUARIO/drunkcoq-eventos.git
git branch -M main
git push -u origin main
```

Listo, tu código ya está en GitHub. El archivo `.env` con tus credenciales reales **no se sube** (es intencional, por seguridad).

---

## 7. Publicar la web online con GitHub Pages

Este proyecto ya viene configurado para publicarse en:

**https://tomypalarich.github.io/sistemaDrunkCoq/**

usando un proceso automático (GitHub Actions) que compila el proyecto solo, cada vez que hacés `git push`. Seguí estos pasos una sola vez:

### 7.1 Cargar tus claves de Firebase como "secretos" del repositorio

Como el archivo `.env` no se sube a GitHub, tenés que cargar esas mismas 6 claves directamente en GitHub para que el proceso automático las use al compilar:

1. En tu repositorio de GitHub, andá a **Settings → Secrets and variables → Actions**.
2. Hacé clic en **"New repository secret"** y cargá, una por una, estas 6 claves (nombre exacto a la izquierda, tu valor de Firebase a la derecha):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### 7.2 Activar GitHub Pages con "GitHub Actions" como origen

1. En el repositorio, andá a **Settings → Pages**.
2. Donde dice **"Source"**, elegí **"GitHub Actions"** (no "Deploy from a branch").

### 7.3 Subir el código

```bash
git add .
git commit -m "Configurar publicación automática en GitHub Pages"
git push
```

Con el push, GitHub va a compilar el proyecto solo (mirá el progreso en la pestaña **"Actions"** de tu repo) y en 1-2 minutos tu app va a estar disponible en `https://tomypalarich.github.io/sistemaDrunkCoq/`.

A partir de ahora, cada vez que hagas `git push` a la rama `main`, la página se actualiza sola.

> ⚠️ Si en algún momento cambiás el nombre del repositorio, tenés que actualizar el valor `base` en `vite.config.js` para que coincida (ej: `base: "/nuevo-nombre/"`), o la página va a verse en blanco otra vez.

### Alternativa: Vercel

Si preferís no depender de GitHub Actions, [Vercel](https://vercel.com) es más simple: conectás el repo, cargás las mismas 6 variables de entorno en su panel, y listo. Funciona igual de bien con Firebase.

---

## 8. Seguridad de las reglas de Firestore (importante)

Por defecto, el proyecto asume reglas abiertas para que puedas probar rápido (ver `firestore.rules`). Eso significa que **cualquiera que tenga tu configuración de Firebase podría leer o escribir en tu base de datos**. Para una app que vas a compartir públicamente o usar en producción:

1. Andá a Firestore Database → pestaña **Reglas** en la consola de Firebase.
2. Como mínimo, restringí la escritura a usuarios autenticados, por ejemplo:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Esto requeriría agregar un login (Firebase Authentication) a la app — si querés, te puedo ayudar a sumarlo en otro paso.

---

## 9. Estructura del proyecto

```
drunkcoq-eventos/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── firestore.rules          ← reglas de referencia para Firestore
├── .env.example              ← plantilla de variables de entorno
├── .gitignore
└── src/
    ├── main.jsx               ← punto de entrada
    ├── index.css              ← estilos base (Tailwind + tipografías)
    ├── App.jsx                ← toda la interfaz (Stock, Presupuestos, Proveedores)
    ├── firebase.js             ← inicialización de Firebase
    ├── firestoreApi.js         ← funciones de lectura/escritura en Firestore
    └── mockData.js              ← datos de ejemplo usados solo para precargar la base
```

## 10. Las secciones

- **Stock**: productos con número correlativo automático, precio de costo, precio de venta y proveedor asociado. Alta/edición/baja (individual o múltiple), categorías creables al vuelo, búsqueda, filtros, alerta de stock mínimo, ordenamiento e historial de movimientos.
- **Administración → Presupuestos**: cotizaciones de eventos con número correlativo automático (#001, #002...), tipo de barra, lista de adicionales (con precio) y monto base, con el total calculado automáticamente. Buscador de proveedores con sugerencias en vivo y proveedor de contacto resaltado.
- **Administración → Centro de Costos**: pantalla analítica en tiempo real con estado de los presupuestos, valor total del inventario (costo y venta), y comparativa de gasto de stock vs. facturación de presupuestos aprobados.
- **Planillas**: elegí un presupuesto y completá digitalmente la Planilla A (herramientas y logística) o la Planilla B (mercadería y consumos), con botón para imprimir o guardar como PDF (usa el diálogo de impresión del navegador, con hoja limpia sin la interfaz de la app).
- **Proveedores**: alta, edición y baja, categorías creables al vuelo, filtro y ordenamiento por categoría o alfabético. Los proveedores cargados acá aparecen disponibles automáticamente en Stock y en Presupuestos.

Todos los datos —incluidas las planillas y categorías— se sincronizan en tiempo real: si dos personas tienen la app abierta a la vez, los cambios de una se reflejan al instante en la pantalla de la otra.
