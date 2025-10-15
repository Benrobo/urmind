export class ContextSpotlightVisibilityStore {
  private readonly STORAGE_KEY = "context_spotlight_visibility";

  async show(): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, "true");
  }

  async hide(): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, "false");
  }

  async toggle(): Promise<boolean> {
    const current = await this.isVisible();
    const newState = !current;
    await this.set(newState);
    return newState;
  }

  async set(visible: boolean): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, visible.toString());
  }

  async isVisible(): Promise<boolean> {
    const value = localStorage.getItem(this.STORAGE_KEY);
    return value === "true";
  }

  getValue(): boolean {
    const value = localStorage.getItem(this.STORAGE_KEY);
    return value === "true";
  }

  addStorageListener(callback: (visible: boolean) => void): () => void {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === this.STORAGE_KEY) {
        callback(e.newValue === "true");
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }
}

export const contextSpotlightVisibilityStore =
  new ContextSpotlightVisibilityStore();
