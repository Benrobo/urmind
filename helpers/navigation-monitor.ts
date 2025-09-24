interface NavigationMonitorOptions {
  onNavigationChange?: (newUrl: string, oldUrl: string) => void;
}

class NavigationMonitor {
  private currentUrl: string;
  private urlObserver: MutationObserver | null = null;
  private buttonObserver: MutationObserver | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private buttonCleanup: (() => void) | undefined;
  private options: NavigationMonitorOptions;
  private isMonitoring = false;
  private originalPushState = history.pushState;
  private originalReplaceState = history.replaceState;

  constructor(options: NavigationMonitorOptions) {
    this.currentUrl = location.href;
    this.options = options;
  }

  async startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    console.log("Starting comprehensive navigation and button monitoring");

    // 1. Monitor URL changes via DOM mutations
    this.setupUrlObserver();

    // 2. Monitor history API changes
    this.setupHistoryMonitoring();
  }

  stopMonitoring() {
    this.isMonitoring = false;

    if (this.urlObserver) {
      this.urlObserver.disconnect();
      this.urlObserver = null;
    }

    if (this.buttonObserver) {
      this.buttonObserver.disconnect();
      this.buttonObserver = null;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.buttonCleanup) {
      this.buttonCleanup();
      this.buttonCleanup = undefined;
    }

    this.restoreHistoryMethods();
  }

  private setupUrlObserver() {
    this.urlObserver = new MutationObserver(async (mutations) => {
      const newUrl = location.href;
      if (newUrl !== this.currentUrl) {
        console.log("Navigation detected via DOM mutation:", {
          from: this.currentUrl,
          to: newUrl,
        });

        await this.handleNavigation(newUrl);
      }
    });

    this.urlObserver.observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["href"],
    });
  }

  private setupHistoryMonitoring() {
    history.pushState = (...args) => {
      this.originalPushState.apply(history, args);
      const newUrl = location.href;
      if (newUrl !== this.currentUrl) {
        console.log("Navigation detected via pushState:", newUrl);
        this.handleNavigation(newUrl);
      }
    };

    history.replaceState = (...args) => {
      this.originalReplaceState.apply(history, args);
      const newUrl = location.href;
      if (newUrl !== this.currentUrl) {
        console.log("Navigation detected via replaceState:", newUrl);
        this.handleNavigation(newUrl);
      }
    };

    // Listen for popstate events (back/forward buttons)
    window.addEventListener("popstate", () => {
      const newUrl = location.href;
      if (newUrl !== this.currentUrl) {
        console.log("Navigation detected via popstate:", newUrl);
        this.handleNavigation(newUrl);
      }
    });
  }

  private async handleNavigation(newUrl: string) {
    const oldUrl = this.currentUrl;
    this.currentUrl = newUrl;

    // Wait for new page to load
    await this.waitForPageLoad();

    // Notify about navigation change
    this.options.onNavigationChange?.(newUrl, oldUrl);
  }

  private async waitForPageLoad(): Promise<void> {
    return new Promise((resolve) => {
      // Fallback: resolve after 2 seconds
      setTimeout(resolve, 2000);
    });
  }

  private restoreHistoryMethods() {
    history.pushState = this.originalPushState;
    history.replaceState = this.originalReplaceState;
  }
}

export default NavigationMonitor;
