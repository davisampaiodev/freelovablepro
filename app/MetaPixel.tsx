"use client";

import { useEffect } from "react";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: (...args: unknown[]) => void;
};

export default function MetaPixel() {
  useEffect(() => {
    const pixelWindow = window as typeof window & { fbq?: Fbq; _fbq?: Fbq };
    if (pixelWindow.fbq) {
      document.documentElement.dataset.metaPixel = "ready";
      return;
    }

    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as Fbq;

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = (...args: unknown[]) => fbq(...args);
    pixelWindow.fbq = fbq;
    pixelWindow._fbq = fbq;
    document.documentElement.dataset.metaPixel = "ready";

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    fbq("init", "1154397371091882");
    fbq("track", "PageView");
  }, []);

  return null;
}
