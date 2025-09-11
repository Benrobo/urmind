import { browser } from "wxt/browser";
import { ContentScriptContext } from "wxt/utils/content-script-context";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import ReactDOM from "react-dom/client";
import Root from "@/components/Root.tsx";

export default defineContentScript({
  matches: ["https://en.wikipedia.org/*"],
  async main(ctx) {
    console.log("Hello content.");

    // Example: Open sidepanel when user clicks a specific element
    document.addEventListener("click", async (event) => {
      try {
        await browser.runtime.sendMessage({ action: "openSidePanel" });
      } catch (error) {
        console.log("Could not open sidepanel:", error);
      }
    });

    await renderMainAppUi(ctx);
  },
});

async function renderMainAppUi(ctx: ContentScriptContext) {
  await waitForBody();

  const ui = await createShadowRootUi(ctx, {
    name: "waymaker-context-keeper",
    position: "overlay",
    anchor: "body",
    onMount: (container: HTMLElement) => {
      // Don't mount react app directly on <body>
      const wrapper = document.createElement("div");
      wrapper.className = "waymaker-ctx-keeper-wrapper";
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
