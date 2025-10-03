import { StorageStore } from "@/helpers/storage-store";

// Store for mindboard state management
export class MindboardStore extends StorageStore<{
  selectedCategory: string | null;
  viewMode: "canvas" | "list";
  contextPositions: Record<string, { x: number; y: number }>;
}> {
  constructor() {
    super("local:mindboard_state", {
      selectedCategory: null,
      viewMode: "canvas",
      contextPositions: {},
    });
  }

  // Category management
  async setSelectedCategory(category: string | null): Promise<void> {
    const currentState = await this.get();
    await this.set({ ...currentState, selectedCategory: category });
  }

  async clearSelectedCategory(): Promise<void> {
    await this.setSelectedCategory(null);
  }

  async getSelectedCategory(): Promise<string | null> {
    const state = await this.get();
    return state.selectedCategory;
  }

  async isCategorySelected(category: string): Promise<boolean> {
    const selectedCategory = await this.getSelectedCategory();
    return selectedCategory === category;
  }

  // Context position management
  async setContextPosition(
    contextId: string,
    position: { x: number; y: number }
  ): Promise<void> {
    const currentState = await this.get();
    await this.set({
      ...currentState,
      contextPositions: {
        ...currentState.contextPositions,
        [contextId]: position,
      },
    });
  }

  async getContextPosition(
    contextId: string
  ): Promise<{ x: number; y: number } | null> {
    const state = await this.get();
    return state.contextPositions[contextId] || null;
  }

  async getAllContextPositions(): Promise<
    Record<string, { x: number; y: number }>
  > {
    const state = await this.get();
    return state.contextPositions;
  }

  async clearContextPosition(contextId: string): Promise<void> {
    const currentState = await this.get();
    const newPositions = { ...currentState.contextPositions };
    delete newPositions[contextId];
    await this.set({ ...currentState, contextPositions: newPositions });
  }

  async clearAllContextPositions(): Promise<void> {
    const currentState = await this.get();
    await this.set({ ...currentState, contextPositions: {} });
  }

  // View mode management
  async setViewMode(mode: "canvas" | "list"): Promise<void> {
    const currentState = await this.get();
    await this.set({ ...currentState, viewMode: mode });
  }

  async getViewMode(): Promise<"canvas" | "list"> {
    const state = await this.get();
    return state.viewMode;
  }

  async toggleViewMode(): Promise<"canvas" | "list"> {
    const currentMode = await this.getViewMode();
    const newMode = currentMode === "canvas" ? "list" : "canvas";
    await this.setViewMode(newMode);
    return newMode;
  }

  // Get full state
  async getMindboardState(): Promise<{
    selectedCategory: string | null;
    viewMode: "canvas" | "list";
    contextPositions: Record<string, { x: number; y: number }>;
  }> {
    return await this.get();
  }
}

export const mindboardStore = new MindboardStore();
