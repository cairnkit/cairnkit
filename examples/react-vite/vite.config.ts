import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Workspace packages are symlinked; without this Vite can resolve a second
  // copy of React through them and hooks break.
  resolve: { dedupe: ["react", "react-dom"] },
});
