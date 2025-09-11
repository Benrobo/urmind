import "~/assets/main.css";
import { browser } from "wxt/browser";
import { ContentScriptContext } from "wxt/utils/content-script-context";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import ReactDOM from "react-dom/client";
import Root from "@/components/Root.tsx";

import "../assets/main.css";
import { SUPPORTED_DOMAINS } from "@/config";

export default defineContentScript({
  matches: SUPPORTED_DOMAINS,
  cssInjectionMode: "ui",
  runAt: "document_start",
  async main(ctx) {
    console.log("Hello content.");

    const mountUi = async () => {
      await renderMainAppUi(ctx);
    };

    await mountUi();
  },
});

async function renderMainAppUi(ctx: ContentScriptContext) {
  await waitForBody();

  const ui = await createShadowRootUi(ctx, {
    name: "urmind-wrapper",
    position: "overlay",
    anchor: "body",
    onMount: (container: HTMLElement) => {
      // Don't mount react app directly on <body>
      const wrapper = document.createElement("div");
      wrapper.className = "urmind-wrapper";
      wrapper.style.background = "transparent";
      wrapper.style.backgroundColor = "transparent";
      container.append(wrapper);

      const root = ReactDOM.createRoot(wrapper);
      root.render(<Root />);
      return { root, wrapper };
    },
    onRemove: (
      elements: { root: ReactDOM.Root; wrapper: HTMLElement } | undefined
    ) => {
      elements?.root.unmount();
      elements?.wrapper.remove();
    },
  });

  ui.mount();
  return ui;
}

// Wait for DOM to be ready before mounting
const waitForBody = () => {
  return new Promise<void>((resolve) => {
    if (document.body) {
      resolve();
    } else {
      const observer = new MutationObserver(() => {
        if (document.body) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  });
};
