import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import md5 from "md5";

export const cn = (...classes: ClassValue[]) => {
  return twMerge(clsx(classes));
};

export const md5Hash = (text: string) => {
  return md5(text);
};

export const shortenText = (url: string, length: number = 10) => {
  if (!url) return "";
  return url.length > length ? url.substring(0, length) + "..." : url;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param immediate - If true, trigger the function on the leading edge instead of the trailing edge
 * @returns The debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
};

/**
 * Cleans a URL for fingerprinting by removing query parameters and fragments
 * to ensure the same page gets the same fingerprint regardless of URL params.
 *
 * @param url - The URL to clean
 * @returns Clean URL without query parameters or fragments
 */
export const cleanUrlForFingerprint = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Keep only protocol, hostname, port, and pathname
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch (error) {
    console.error("Error cleaning URL for fingerprint:", error);
    // Fallback: just remove query params and fragments with string manipulation
    const queryIndex = url.indexOf("?");
    const hashIndex = url.indexOf("#");

    let cleanedUrl = url;
    if (queryIndex !== -1) {
      cleanedUrl = cleanedUrl.substring(0, queryIndex);
    }
    if (hashIndex !== -1 && (queryIndex === -1 || hashIndex < queryIndex)) {
      cleanedUrl = url.substring(0, hashIndex);
    }

    return cleanedUrl;
  }
};

/**
 * Constructs a URL with a text fragment for highlighting text in browsers that support it.
 * Example output:
 *   https://example.com/page.html#:~:text=Swallowed%20Stars%5B1%5D%20is%20a%20long%20online%20science%20fiction
 *
 * @param url - The base URL to append the text fragment to.
 * @param highlightText - The text to highlight (will be URL-encoded).
 * @returns The URL with the text fragment, or the original URL if an error occurs.
 */
export const constructUrlTextFragment = (
  url: string,
  highlightText: string
): string => {
  try {
    if (!highlightText || !highlightText.trim()) return url;
    const urlObj = new URL(url);
    urlObj.hash = "";

    const encodedText = encodeURIComponent(highlightText);
    urlObj.hash = `:~:text=${encodedText}`;

    return urlObj.toString();
  } catch (err: any) {
    console.error("Error constructing url text fragment:", err);
    return url;
  }
};
