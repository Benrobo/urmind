import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  dev: {
    server: {
      port: 5174,
    },
  },
  imports: false,
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@electric-sql/pglite"],
    },
  }),
  manifest: ({ browser, command, manifestVersion, mode }) => {
    return {
      name: "Urmind",
      description: "Your mind in your browser.",
      version: "0.1.0",
      permissions: ["storage", "activeTab", "omnibox", "tabs", "contextMenus"],
      host_permissions: [
        "https://generativelanguage.googleapis.com/*",
        "https://cdnjs.cloudflare.com/*",
      ],
      action: {
        // default_title: "Urmind",
      },
      options_ui: {
        page: "/options.html",
        open_in_tab: true,
      },
      omnibox: { keyword: "urmind" },
      content_security_policy: {
        extension_pages:
          "default-src 'self'; img-src 'self' data: blob: https: http:; script-src 'self' 'wasm-unsafe-eval'; style-src-elem 'self' 'unsafe-inline' ws://localhost:5174/ https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com; connect-src 'self' ws://localhost:5174/ http://localhost:5174/ https://generativelanguage.googleapis.com https: http:",
      },
      web_accessible_resources: [
        {
          resources: ["options.html"],
          matches: ["<all_urls>"],
        },
      ],
      icons: {
        "16": "icons/icon16.png",
        "32": "icons/icon32.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png",
      },
    };
  },
});
