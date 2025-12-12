"use client";

import { useEffect } from "react";

export default function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const html = document.documentElement;
    const body = document.body;

    // Save current values
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;

    // iOS-safe lock: freeze body at current scroll position
    const scrollY = window.scrollY;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      // Restore
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;

      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
