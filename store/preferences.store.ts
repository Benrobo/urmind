import { StorageStore } from "@/helpers/storage-store";

export type GenerationStyle = "online" | "offline";

export interface PreferencesState {
  generationStyle: GenerationStyle;
  geminiApiKey: string;
  showPreferences: boolean;
}

export class PreferencesStore extends StorageStore<PreferencesState> {
  constructor() {
    super("local:preferences", {
      generationStyle: "offline",
      geminiApiKey: "",
      showPreferences: false,
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
}

export const preferencesStore = new PreferencesStore();
