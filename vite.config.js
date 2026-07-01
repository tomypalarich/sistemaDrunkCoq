import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El "base" tiene que coincidir con el nombre del repositorio de GitHub,
// para que los archivos (JS, CSS) se carguen desde la ruta correcta en GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: "/sistemaDrunkCoq/",
});
