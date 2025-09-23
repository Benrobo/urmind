import { StorageStore } from "@/helpers/storage-store";

// Store for managing UI component states
export class UIStore extends StorageStore<{
  showDeepResearch: boolean;
  showSavedContext: boolean;
  showChat: boolean;
}> {
  constructor() {
    super("local:ui_state", {
      showDeepResearch: true,
      showSavedContext: true,
      showChat: false,
    });
  }

  // Deep Research methods
  async setShowDeepResearch(show: boolean): Promise<void> {
    const currentState = await this.get();
    await this.set({ ...currentState, showDeepResearch: show });
  }

  async toggleDeepResearch(): Promise<boolean> {
    const currentState = await this.get();
    const newValue = !currentState.showDeepResearch;
    await this.set({ ...currentState, showDeepResearch: newValue });
    return newValue;
  }

  async isDeepResearchVisible(): Promise<boolean> {
    const state = await this.get();
    return state.showDeepResearch;
  }

  // Saved Context methods
  async setShowSavedContext(show: boolean): Promise<void> {
    const currentState = await this.get();
    await this.set({ ...currentState, showSavedContext: show });
  }

  async toggleSavedContext(): Promise<boolean> {
    const currentState = await this.get();
    const newValue = !currentState.showSavedContext;
    await this.set({ ...currentState, showSavedContext: newValue });
    return newValue;
  }

  async isSavedContextVisible(): Promise<boolean> {
    const state = await this.get();
    return state.showSavedContext;
  }

  // Chat methods
  async setShowChat(show: boolean): Promise<void> {
    const currentState = await this.get();
    await this.set({ ...currentState, showChat: show });
  }

  async toggleChat(): Promise<boolean> {
    const currentState = await this.get();
    const newValue = !currentState.showChat;
    await this.set({ ...currentState, showChat: newValue });
    return newValue;
  }

  async isChatVisible(): Promise<boolean> {
    const state = await this.get();
    return state.showChat;
  }

  // Reset to default state
  async resetToDefaults(): Promise<void> {
    await this.set({
      showDeepResearch: true,
      showSavedContext: true,
      showChat: false,
    });
  }

  // Get current UI state
  async getUIState(): Promise<{
    showDeepResearch: boolean;
    showSavedContext: boolean;
    showChat: boolean;
  }> {
    return await this.get();
  }
}

export const uiStore = new UIStore();
