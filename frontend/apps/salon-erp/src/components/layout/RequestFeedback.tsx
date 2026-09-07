"use client";

import { useEffect, useRef } from "react";

export default function RequestFeedback() {
  const requests = useRef(new Map<string, HTMLButtonElement>());
  const buttons = useRef(new Map<HTMLButtonElement, { count: number; html: string }>());

  useEffect(() => {
    const start = (event: Event) => {
      const detail = (event as CustomEvent<{ requestId: string; button: unknown }>).detail;
      const button = detail?.button instanceof HTMLButtonElement ? detail.button : null;
      if (!button || button.dataset.navigation === "true") return;
      const current = buttons.current.get(button);
      if (current) current.count += 1;
      else {
        buttons.current.set(button, { count: 1, html: button.innerHTML });
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
        button.classList.add("cursor-wait", "opacity-70");
        button.textContent = "Working…";
      }
      requests.current.set(detail.requestId, button);
    };
    const end = (event: Event) => {
      const detail = (event as CustomEvent<{ requestId: string }>).detail;
      const button = requests.current.get(detail?.requestId);
      if (!button) return;
      requests.current.delete(detail.requestId);
      const current = buttons.current.get(button);
      if (!current) return;
      current.count -= 1;
      if (current.count > 0) return;
      button.innerHTML = current.html;
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.classList.remove("cursor-wait", "opacity-70");
      buttons.current.delete(button);
    };
    window.addEventListener("dropxcutz:request-start", start);
    window.addEventListener("dropxcutz:request-end", end);
    return () => {
      window.removeEventListener("dropxcutz:request-start", start);
      window.removeEventListener("dropxcutz:request-end", end);
    };
  }, []);
  return null;
}
