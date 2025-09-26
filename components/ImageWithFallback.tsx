import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";
import urmindLogo from "~/public/icons/icon128.png";

type ImageWithFallbackProps = {
  src: string | null;
  className?: string;
};

export function ImageWithFallback({ src, className }: ImageWithFallbackProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  useEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }

    let isMounted = true;
    let fetchController: AbortController;
    let imageTimeoutId: NodeJS.Timeout;

    const cleanup = () => {
      isMounted = false;
      fetchController?.abort();
      clearTimeout(imageTimeoutId);
    };

    const loadImage = () => {
      const img = new Image();

      img.onload = () => {
        if (isMounted) {
          clearTimeout(imageTimeoutId);
          setStatus("loaded");
        }
      };

      img.onerror = () => {
        if (isMounted) {
          clearTimeout(imageTimeoutId);
          setStatus("error");
        }
      };

      imageTimeoutId = setTimeout(() => {
        if (isMounted) {
          setStatus("error");
        }
      }, 5000);

      img.src = src;
    };

    // First try HEAD request to check accessibility
    fetchController = new AbortController();

    setTimeout(() => {
      fetchController.abort();
    }, 2000);

    fetch(src, {
      method: "HEAD",
      mode: "no-cors",
      signal: fetchController.signal,
    })
      .then(() => {
        // HEAD succeeded, proceed with image load
        loadImage();
      })
      .catch(() => {
        // HEAD failed, but still try to load the image
        // (some servers block HEAD but allow GET)
        loadImage();
      });

    return cleanup;
  }, [src]);

  if (status === "error" || !src) {
    // return <Globe className="w-[32px] h-[32px] text-gray-400" />;
    return (
      <img
        src={urmindLogo}
        alt="Favicon"
        className={cn("w-full h-full object-contain", className)}
        onError={() => setStatus("error")}
      />
    );
  }

  if (status === "loading") {
    return (
      <div className="w-[32px] h-[32px] flex items-center justify-center">
        <div className="w-6 h-6 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Favicon"
      className={cn("w-full h-full object-cover", className)}
      onError={() => setStatus("error")}
    />
  );
}
