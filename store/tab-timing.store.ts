import { StorageStore } from "@/helpers/storage-store";
import { PageMetadata } from "@/services/page-extraction/extraction";
import { preferencesStore } from "@/store/preferences.store";
import dayjs from "dayjs";

export interface TabTimingData {
  tabId: number;
  url: string;
  startTime: number;
  pageMetadata: PageMetadata;
}

export class TabTimingStore extends StorageStore<TabTimingData[]> {
  constructor() {
    super("local:tab_timing", []);
  }

  async addTab(
    tabId: number,
    url: string,
    pageMetadata: PageMetadata
  ): Promise<void> {
    const currentTabs = await this.get();
    const existingTab = currentTabs.find((tab) => tab.tabId === tabId);

    const now = Date.now();
    const tabData: TabTimingData = {
      tabId,
      url,
      startTime: now,
      pageMetadata,
    };

    if (existingTab) {
      // Update existing tab
      const updatedTabs = currentTabs.map((tab) =>
        tab.tabId === tabId
          ? { ...tabData, startTime: tab.startTime } // Keep original start time
          : tab
      );
      await this.set(updatedTabs);
    } else {
      // Add new tab
      await this.set([...currentTabs, tabData]);
    }
  }

  async updateTabMetadata(
    tabId: number,
    pageMetadata: TabTimingData["pageMetadata"]
  ): Promise<void> {
    const currentTabs = await this.get();
    const updatedTabs = currentTabs.map((tab) =>
      tab.tabId === tabId ? { ...tab, pageMetadata } : tab
    );
    await this.set(updatedTabs);
  }

  async removeTab(tabId: number): Promise<void> {
    const currentTabs = await this.get();
    const filteredTabs = currentTabs.filter((tab) => tab.tabId !== tabId);
    await this.set(filteredTabs);
  }

  async getTabsReadyForIndexing(): Promise<TabTimingData[]> {
    const currentTabs = await this.get();
    const now = dayjs();
    const minimumTabTimeMs = await preferencesStore.getTabTimingInMs();

    return currentTabs.filter((tab) => {
      const startTime = dayjs(tab.startTime);
      const timeSpent = now.diff(startTime);
      return timeSpent >= minimumTabTimeMs;
    });
  }

  async getTabById(tabId: number): Promise<TabTimingData | undefined> {
    const currentTabs = await this.get();
    return currentTabs.find((tab) => tab.tabId === tabId);
  }
}

export const tabTimingStore = new TabTimingStore();
