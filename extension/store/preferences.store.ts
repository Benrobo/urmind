import { StorageStore } from "@/helpers/storage-store";

export type GenerationStyle = "online" | "offline";
export type TimeUnit = "seconds" | "minutes" | "hours";
export type IndexingMode = "automatic" | "manual" | "disabled";

export interface TabTimingPreferences {
  duration: number;
  timeUnit: TimeUnit;
}

export interface PreferencesState {
  generationStyle: GenerationStyle;
  geminiApiKey: string;
  showPreferences: boolean;
  tabTiming: TabTimingPreferences;
  indexingMode: IndexingMode;
  indexingEnabled: boolean; // Keep for backward compatibility
}

export class PreferencesStore extends StorageStore<PreferencesState> {
  constructor() {
    super("local:preferences", {
      generationStyle: "offline",
      geminiApiKey: "",
      showPreferences: false,
      tabTiming: {
        duration: 2,
        timeUnit: "minutes",
      },
      indexingMode: "automatic",
      indexingEnabled: true, // Keep for backward compatibility
    });
  }

  async setGenerationStyle(style: GenerationStyle): Promise<void> {
    const currentState = await this.get();
    await this.set({ ...currentState, generationStyle: style });
  }

  async setGeminiApiKey(key: string): Promise<void> {
    const currentState = await this.get();
    await this.set({ ...currentState, geminiApiKey: key });
  }

  async setShowPreferences(show: boolean): Promise<void> {
    const currentState = await this.get();
    await this.set({ ...currentState, showPreferences: show });
  }

  async togglePreferences(): Promise<boolean> {
    const currentState = await this.get();
    const newValue = !currentState.showPreferences;
    await this.set({ ...currentState, showPreferences: newValue });
    return newValue;
  }

  async getGenerationStyle(): Promise<GenerationStyle> {
    const state = await this.get();
    return state.generationStyle;
  }

  async getGeminiApiKey(): Promise<string> {
    const state = await this.get();
    return state.geminiApiKey;
  }

  async isPreferencesVisible(): Promise<boolean> {
    const state = await this.get();
    return state.showPreferences;
  }

  async hasValidApiKey(): Promise<boolean> {
    const state = await this.get();
    return state.geminiApiKey.trim().length > 0;
  }

  async setTabTiming(tabTiming: TabTimingPreferences): Promise<void> {
    const currentState = await this.get();
    await this.set({ ...currentState, tabTiming });
  }

  async getTabTiming(): Promise<TabTimingPreferences> {
    const state = await this.get();
    return state.tabTiming;
  }

  async getTabTimingInMs(): Promise<number> {
    const tabTiming = await this.getTabTiming();
    const { duration, timeUnit } = tabTiming;

    switch (timeUnit) {
      case "seconds":
        return duration * 1000;
      case "minutes":
        return duration * 60 * 1000;
      case "hours":
        return duration * 60 * 60 * 1000;
      default:
        return 1 * 60 * 1000; // fallback to 1 minute
    }
  }

  async setIndexingMode(mode: IndexingMode): Promise<void> {
    const currentState = await this.get();
    await this.set({
      ...currentState,
      indexingMode: mode,
      indexingEnabled: mode !== "disabled", // Update backward compatibility field
    });
  }

  async getIndexingMode(): Promise<IndexingMode> {
    const state = await this.get();
    return state.indexingMode;
  }

  async setIndexingEnabled(enabled: boolean): Promise<void> {
    const currentState = await this.get();
    const newMode = enabled ? "automatic" : "disabled";
    await this.set({
      ...currentState,
      indexingEnabled: enabled,
      indexingMode: newMode,
    });
  }

  async getIndexingEnabled(): Promise<boolean> {
    const state = await this.get();
    return state.indexingEnabled;
  }
}

export const preferencesStore = new PreferencesStore();
