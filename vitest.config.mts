import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": import.meta.dirname,
      // "server-only" sunucu dışında hata fırlatır; testlerde boş modül kullanılır.
      "server-only": path.join(
        import.meta.dirname,
        "node_modules/server-only/empty.js",
      ),
    },
  },
  test: { environment: "node" },
});
