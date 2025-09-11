import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  dev: {
    server: {
      port: 3000,
    },
  },
  imports: false,
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ browser, command, manifestVersion, mode }) => {
    return {
      name: "Urmind",
      description: "Your mind in your browser.",
      version: "0.1.0",
      permissions: ["storage", "activeTab", "cookies", "alarms", "scripting"],
      host_permissions: ["https://en.wikipedia.org/*"],
      action: {
        default_title: "Urmind",
      },
    };
  },
});
