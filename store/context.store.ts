import { StorageStore } from "@/helpers/storage-store";

// store for context spotlight visibility
export class ContextSpotlightVisibilityStore extends StorageStore<boolean> {
  constructor() {
    super("local:context_spotlight_visibility", false);
    // this.hide(); // hide on initial load
  }

  async show(): Promise<void> {
    await this.set(true);
  }

  async hide(): Promise<void> {
    await this.set(false);
  }

  async toggle(): Promise<boolean> {
    const current = await this.get();
    const newState = !current;
    await this.set(newState);
    return newState;
  }

  async isVisible(): Promise<boolean> {
    return await this.get();
  }
}

export const contextSpotlightVisibilityStore =
  new ContextSpotlightVisibilityStore();
