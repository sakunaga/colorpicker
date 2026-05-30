import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  manifest: {
    name: "KPicker",
    version: "2.1.1",
    permissions: ["storage", "downloads"],
    icons: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
      48: "icons/icon-48.png",
      128: "icons/icon-128.png",
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
