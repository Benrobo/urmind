import { StorageStore } from "@/helpers/storage-store";

export class SessionStore extends StorageStore<string | null> {
  constructor() {
    super("local:auth_token", null);
  }

  async getToken(): Promise<string | null> {
    return await this.get();
  }

  async setToken(token: string): Promise<void> {
    await this.set(token);
  }

  async clearToken(): Promise<void> {
    await this.del("local:auth_token");
  }
}

export class SessionManager extends StorageStore<boolean> {
  constructor() {
    super("local:is_extension_linked", false);
  }

  async isLinked(): Promise<boolean> {
    return await this.get();
  }

  async setLinked(value: boolean): Promise<void> {
    await this.set(value);
  }

  async unlinkSession(): Promise<void> {
    await sessionStore.clearToken();
    await this.set(false);
  }

  async linkSession(): Promise<void> {
    await this.set(true);
  }
}

export const sessionStore = new SessionStore();
export const sessionManager = new SessionManager();
