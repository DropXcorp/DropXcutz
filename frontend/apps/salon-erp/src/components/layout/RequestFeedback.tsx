"use client";

import { useEffect, useState } from "react";

export default function RequestFeedback() {
  const [pending, setPending] = useState(0);
  useEffect(() => {
    let candidate: HTMLButtonElement | null = null;
    const start = () => {
      setPending((value) => value + 1);
      if (candidate && !candidate.disabled) {
        candidate.disabled = true;
        candidate.dataset.requestBusy = "true";
        candidate.dataset.requestOriginal = candidate.innerHTML;
        candidate.textContent = "Saving...";
      }
    };
    const end = () => {
      setPending((value) => Math.max(0, value - 1));
      if (candidate?.dataset.requestBusy === "true") {
        candidate.disabled = false;
        candidate.innerHTML = candidate.dataset.requestOriginal ?? candidate.innerHTML;
        delete candidate.dataset.requestBusy;
        delete candidate.dataset.requestOriginal;
      }
      candidate = null;
    };
    const click = (event: MouseEvent) => {
      const target = event.target;
      candidate = target instanceof Element ? target.closest("button") : null;
    };
    window.addEventListener("dropxcutz:request-start", start);
    window.addEventListener("dropxcutz:request-end", end);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("dropxcutz:request-start", start);
      window.removeEventListener("dropxcutz:request-end", end);
      document.removeEventListener("click", click, true);
    };
  }, []);
  if (!pending) return null;
  return null;
}
