import { StorageStore } from "@/helpers/storage-store";

export interface DomainBlacklistState {
  blacklistedDomains: string[];
}

export class DomainBlacklistStore extends StorageStore<DomainBlacklistState> {
  constructor() {
    super("local:domain_blacklist", {
      blacklistedDomains: [],
    });
  }

  async addDomain(domain: string): Promise<void> {
    const state = await this.get();
    const normalizedDomain = this.normalizeDomain(domain);

    if (!state.blacklistedDomains.includes(normalizedDomain)) {
      await this.set({
        blacklistedDomains: [...state.blacklistedDomains, normalizedDomain],
      });
    }
  }

  async removeDomain(domain: string): Promise<void> {
    const state = await this.get();
    await this.set({
      blacklistedDomains: state.blacklistedDomains.filter((d) => d !== domain),
    });
  }

  async isDomainBlacklisted(url: string): Promise<boolean> {
    const state = await this.get();
    const domain = this.extractDomain(url);

    if (!domain) return false;

    return state.blacklistedDomains.some((blacklistedDomain) => {
      return this.matchesDomain(domain, blacklistedDomain);
    });
  }

  async getAllBlacklistedDomains(): Promise<string[]> {
    const state = await this.get();
    return state.blacklistedDomains;
  }

  private extractDomain(urlOrDomain: string): string | null {
    try {
      let domain = urlOrDomain.trim();

      if (domain.startsWith("http://") || domain.startsWith("https://")) {
        const url = new URL(domain);
        domain = url.hostname;
      } else if (domain.includes("/")) {
        try {
          const url = new URL("https://" + domain);
          domain = url.hostname;
        } catch {
          domain = domain.split("/")[0] ?? "";
        }
      }

      domain = domain.toLowerCase();
      if (domain.startsWith("www.")) {
        domain = domain.substring(4);
      }

      return domain;
    } catch {
      return null;
    }
  }

  private normalizeDomain(domain: string): string {
    const extracted = this.extractDomain(domain);
    return extracted || domain.toLowerCase().trim();
  }

  private matchesDomain(domain: string, pattern: string): boolean {
    const normalizedDomain = domain.toLowerCase();
    const normalizedPattern = pattern.toLowerCase();

    if (normalizedPattern.includes("*")) {
      const regexPattern = normalizedPattern
        .replace(/\./g, "\\.")
        .replace(/\*/g, ".*");
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(normalizedDomain);
    }

    return normalizedDomain === normalizedPattern;
  }
}

export const domainBlacklistStore = new DomainBlacklistStore();
