import "~/assets/main.css";
import { browser } from "wxt/browser";
import { ContentScriptContext } from "wxt/utils/content-script-context";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import ReactDOM from "react-dom/client";
import Root from "@/components/Root.tsx";

import "../assets/main.css";
import { SUPPORTED_DOMAINS } from "@/config";
import pageExtractionService from "@/services/page-extraction/extraction";
import {
  sendMessageToBackgroundScript,
  sendMessageToBackgroundScriptWithResponse,
} from "@/helpers/messaging";
import NavigationMonitor from "@/helpers/navigation-monitor";
import { useMessageHandler } from "@/services/message-handler";
import { contextNavigationService } from "@/services/context-navigation.service";

// initialize embedding model in content script
import { embeddingHelper } from "@/services/embedding-helper";
import { sleep } from "@/lib/utils";

let currentUrl = location.href;
let navigationMonitor: NavigationMonitor | null = null;

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
  // matches: SUPPORTED_DOMAINS,
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  runAt: "document_start",
  async main(ctx) {
    // Set up database message handler (includes embedding operations)
    const dbMessageHandler = useMessageHandler();
    dbMessageHandler.setupListener();

    // Context menu functionality is handled in background script

    // Check for context navigation on page load
    setTimeout(async () => {
      await contextNavigationService.handleContextNavigation();
    }, 1000);

    // Signal to background script that content script is ready
    sendMessageToBackgroundScript({
      action: "content-script-ready",
      payload: {
        tabId: 0, // Will be filled by background script with sender.tab.id
        url: location.href,
      },
    });

    // DEBUG: testing message handler CS->BS BS->CS
    // const response = await sendMessageToBackgroundScriptWithResponse({
    //   action: "db-operation",
    //   payload: { operation: "getAllContexts" },
    // });

    // console.log("🔍 getAllConversations response:", response);

    // wait for dom to get settled
    await sleep(1000);

    // NO NEED TO LISTEN FOR NAVIGATION CHANGE SINCE IT CAN BE HANDLED IN BACKGROUND SCRIPT
    // VIA chrome.tabs.onUpdated listener
    // const pageMetadata = await pageExtractionService.extractPageMetadata();

    // navigationMonitor = new NavigationMonitor({
    //   onNavigationChange: (newUrl, oldUrl) => {
    //     sendMessageToBackgroundScript({
    //       action: "navigation-detected",
    //       payload: {
    //         url: newUrl,
    //         pageMetadata,
    //       },
    //     });
    //   },
    // });
    // await navigationMonitor.startMonitoring();

    window.addEventListener("DOMContentLoaded", () => {
      // sendMessageToBackgroundScript({
      //   action: "navigation-detected",
      //   payload: {
      //     url: location.href,
      //     pageMetadata,
      //   },
      // });
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
      wrapper.style.zIndex = Number.MAX_SAFE_INTEGER.toString();

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

// Context menu functionality is handled in background script
