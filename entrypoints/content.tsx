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
import { useDatabaseMessageHandler } from "@/services/db-message-handler";

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

async function testCreateContext() {
  try {
    await initDb();
    console.log("🧪 Creating test context...");

    const testId = `test-${Date.now()}`;
    const contextId = await urmindDb.contexts?.createContext({
      id: testId,
      fingerprint: testId,
      category: "test",
      type: "text",
      title: "Test Context",
      description: "This is a test context",
      content: "Test content",
      summary: "Test summary",
      url: "https://example.com",
      image: null,
      favicon: null,
    });

    console.log("🧪 Test context created:", contextId);

    // Verify immediately
    const verification = await urmindDb.contexts?.getContext(testId);
    console.log("🧪 Test context verification:", verification);

    // Get all contexts
    const allContexts = await urmindDb.contexts?.getAllContexts();
    console.log("🧪 All contexts after test:", allContexts);
  } catch (error) {
    console.error("🧪 Test failed:", error);
  }
}

function monitorUrlChanges(cb?: () => void) {
  const observer = new MutationObserver(() => {
    if (location.href !== currentUrl) {
      console.log("URL changed from", currentUrl, "to", location.href);
      currentUrl = location.href;
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

    // Set up database message handler
    const { setupListener } = useDatabaseMessageHandler();
    const cleanupHandler = setupListener();

    // Signal to background script that content script is ready
    sendMessageToBackgroundScript({
      action: "content-script-ready",
      payload: {
        tabId: 0, // Will be filled by background script with sender.tab.id
        url: location.href,
      },
    });

    await testCreateContext();

    const pageMetadata = await pageExtractionService.extractPageMetadata();

    monitorUrlChanges(async () => {
      sendMessageToBackgroundScript({
        action: "navigation-detected",
        payload: {
          url: location.href,
          pageMetadata,
        },
      });
    });

    await aiConfig();

    navigationMonitor = new NavigationMonitor({
      onNavigationChange: (newUrl, oldUrl) => {
        sendMessageToBackgroundScript({
          action: "navigation-detected",
          payload: {
            url: newUrl,
            pageMetadata,
          },
        });
      },
    });
    await navigationMonitor.startMonitoring();

    window.addEventListener("DOMContentLoaded", () => {
      console.log("DOMContentLoaded");
      sendMessageToBackgroundScript({
        action: "navigation-detected",
        payload: {
          url: location.href,
          pageMetadata,
        },
      });
    });

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
