class PageExtractionService {
  async extractPageMetadata() {
    if (!document || !document.head || !document.body) {
      console.log("No document or head or body");
      return {
        title: "",
        description: null,
        og: {
          image: null,
          title: null,
          favicon: null,
        },
        pageContent: "",
        pageUrl: "",
      };
    }

    const _title = document.title;
    const _description = document.querySelector("meta[name='description']");
    const _metaTags = document?.head?.querySelectorAll("meta");
    const ogdetails = this.extractOgDetails(Array.from(_metaTags));
    const pageContent = document?.body?.innerText;
    const pageUrl = window.location.href;
    const favicon = this.extractFavicon(pageUrl);

    return {
      title: _title,
      description: _description,
      og: {
        image: ogdetails.ogImage ?? null,
        title: ogdetails.ogTitle ?? null,
        favicon: favicon ?? null,
      },
      pageContent: pageContent,
      pageUrl: pageUrl,
    };
  }

  private cleanUrl(url: string) {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  private extractFavicon(url: string) {
    const cleanUrl = this.cleanUrl(url);
    const rels = [
      "icon",
      "shortcut icon",
      "apple-touch-icon",
      "apple-touch-icon-precomposed",
      "mask-icon",
      "fluid-icon",
      "alternate icon",
    ];

    const links = Array.from(
      document.querySelectorAll(`link[rel]`)
    ) as HTMLLinkElement[];

    for (const rel of rels) {
      const link = links.find((l) => l.rel === rel);
      if (link && link.href) {
        const href = link.getAttribute("href") || link.href;
        return this.normalizeFaviconUrl(href, url);
      }
    }

    const anyIcon = links.find((l) => l.rel.toLowerCase().includes("icon"));
    if (anyIcon && anyIcon.href) {
      const href = anyIcon.getAttribute("href") || anyIcon.href;
      return this.normalizeFaviconUrl(href, url);
    }

    return `${cleanUrl}/favicon.ico`;
  }

  private normalizeFaviconUrl(faviconUrl: string, pageUrl: string): string {
    // If it's already a full URL, return as is
    if (faviconUrl.startsWith("http://") || faviconUrl.startsWith("https://")) {
      return faviconUrl;
    }

    // If it's protocol-relative (starts with //), add the current protocol
    if (faviconUrl.startsWith("//")) {
      const protocol = new URL(pageUrl).protocol;
      return `${protocol}${faviconUrl}`;
    }

    // If it's relative, make it absolute
    if (faviconUrl.startsWith("/")) {
      const url = new URL(pageUrl);
      return `${url.protocol}//${url.host}${faviconUrl}`;
    }

    // If it's a relative path without leading slash, add it to the current path
    const url = new URL(pageUrl);
    const basePath = url.pathname.substring(
      0,
      url.pathname.lastIndexOf("/") + 1
    );
    return `${url.protocol}//${url.host}${basePath}${faviconUrl}`;
  }

  private extractOgDetails(_metaTags: HTMLMetaElement[]) {
    let ogImage: string | undefined = undefined;
    let ogTitle: string | undefined = undefined;
    for (const meta of _metaTags) {
      for (const attr of Array.from(meta?.attributes ?? [])) {
        if (
          (attr.name === "property" || attr.localName === "property") &&
          attr.value.includes("og:image")
        ) {
          if (!ogImage) ogImage = meta.getAttribute("content") || undefined;
        }
        if (attr.name === "property" && attr.value.includes("og:title")) {
          if (!ogTitle) ogTitle = meta.getAttribute("content") || undefined;
        }
      }
      if (ogImage && ogTitle) break;
    }

    return {
      ogImage,
      ogTitle,
    };
  }
}

const pageExtractionService = new PageExtractionService();

export default pageExtractionService;
