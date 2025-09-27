import { StorageStore } from "@/helpers/storage-store";

export type EmbeddingStyle = "local" | "online";
export type GenerationStyle = "online" | "offline";

export interface PreferencesState {
  embeddingStyle: EmbeddingStyle;
  generationStyle: GenerationStyle;
  geminiApiKey: string;
  showPreferences: boolean;
}

export class PreferencesStore extends StorageStore<PreferencesState> {
  constructor() {
    super("local:preferences", {
      embeddingStyle: "local",
      generationStyle: "offline",
      geminiApiKey: "",
      showPreferences: false,
    });
  }

  async setEmbeddingStyle(style: EmbeddingStyle): Promise<void> {
    const currentState = await this.get();
    await this.set({ ...currentState, embeddingStyle: style });
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

  async getEmbeddingStyle(): Promise<EmbeddingStyle> {
    const state = await this.get();
    return state.embeddingStyle;
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
}

export const preferencesStore = new PreferencesStore();
