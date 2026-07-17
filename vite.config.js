import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Capacitor 웹뷰(로컬 파일)에서도 동작하도록 상대 경로 base 사용
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "dist" },
});
