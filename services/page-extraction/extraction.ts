class PageExtractionService {
  async extractPageMetadata() {
    const _title = document.title;
    const _description = document.querySelector("meta[name='description']");
    const _metaTags = document.head.querySelectorAll("meta");
    const ogdetails = this.extractOgDetails(Array.from(_metaTags));
    const pageContent = document.body.innerText;
    const pageUrl = window.location.href;

    return {
      title: _title,
      description: _description,
      og: {
        image: ogdetails.ogImage ?? null,
        title: ogdetails.ogTitle ?? null,
      },
      pageContent: pageContent,
      pageUrl: pageUrl,
    };
  }

  private extractOgDetails(_metaTags: HTMLMetaElement[]) {
    let ogImage: string | undefined = undefined;
    let ogTitle: string | undefined = undefined;

    for (const meta of _metaTags) {
      for (const attr of Array.from(meta.attributes)) {
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
