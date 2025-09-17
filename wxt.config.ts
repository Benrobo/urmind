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
      permissions: [
        "storage",
        "activeTab",
        "cookies",
        "alarms",
        "scripting",
        "omnibox",
        "tabs",
      ],
      host_permissions: [
        "https://en.wikipedia.org/*",
        "http://127.0.0.1/*",
        "http://localhost/*",
      ],
      action: {
        default_title: "Urmind",
      },
      options_ui: {
        page: "/options.html",
        open_in_tab: true,
      },
      omnibox: { keyword: "urmind" },
      content_security_policy: {
        extension_pages: "script-src 'self'; object-src 'self'",
      },
      web_accessible_resources: [
        {
          resources: ["options.html"],
          matches: ["<all_urls>"],
        },
      ],
    };
  },
});
