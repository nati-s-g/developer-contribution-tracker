import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "./test/server-only-mock.ts"),
      "@": path.resolve(__dirname, "./"),
    },
  },
});
