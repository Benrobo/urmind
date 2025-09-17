import "~/assets/main.css";
import { browser } from "wxt/browser";
import { ContentScriptContext } from "wxt/utils/content-script-context";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import ReactDOM from "react-dom/client";
import Root from "@/components/Root.tsx";
import urmindDb, { initDb } from "@/services/db";

import "../assets/main.css";
import { SUPPORTED_DOMAINS } from "@/config";
import { chromeAi } from "@/helpers/agent/utils";
import aiService from "@/services/ai.service";
import pageExtractionService from "@/services/page-extraction/extraction";
import { sendMessageToBackgroundScript } from "@/helpers/messaging";
import NavigationMonitor from "@/helpers/navigation-monitor";

let currentUrl = location.href;
let navigationMonitor: NavigationMonitor | null = null;

async function aiConfig() {
  await aiService.init();

  // const embeddingFactory = new EmbeddingFactory();

  // const vectorSearch = await urmindDb.embeddings?.cosineSimilarity(
  //   "Hello, world!",
  //   {
  //     limit: 10,
  //   }
  // );

  // console.log({ vectorSearch });
}

function monitorUrlChanges(cb?: () => void) {
  const observer = new MutationObserver(() => {
    if (location.href !== currentUrl) {
      console.log("URL changed from", currentUrl, "to", location.href);
      currentUrl = location.href;

      sendMessageToBackgroundScript({
        action: "navigation-detected",
        payload: {
          url: location.href,
        },
      });

      cb?.();
    }
  });

  observer.observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["href"],
  });

  return observer;
}

export default defineContentScript({
  matches: SUPPORTED_DOMAINS,
  cssInjectionMode: "ui",
  runAt: "document_start",
  async main(ctx) {
    await initDb();

    monitorUrlChanges();

    await aiConfig();

    navigationMonitor = new NavigationMonitor({
      onNavigationChange: (newUrl, oldUrl) => {
        sendMessageToBackgroundScript({
          action: "navigation-detected",
          payload: {
            url: newUrl,
          },
        });
      },
    });
    await navigationMonitor.startMonitoring();

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
