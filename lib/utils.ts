import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import md5 from "md5";

export const cn = (...classes: ClassValue[]) => {
  return twMerge(clsx(classes));
};

export const md5Hash = (text: string) => {
  return md5(text);
};
