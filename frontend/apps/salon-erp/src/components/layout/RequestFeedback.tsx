"use client";

import { useEffect, useRef, useState } from "react";

type StartDetail = { requestId: string; button: unknown };

export default function RequestFeedback() {
  const requests = useRef(new Map<string, HTMLButtonElement>());
  const buttons = useRef(new Map<HTMLButtonElement, number>());
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const start = (event: Event) => {
      const detail = (event as CustomEvent<StartDetail>).detail;
      setPending((count) => count + 1);
      const button = detail?.button instanceof HTMLButtonElement ? detail.button : null;
      if (!button || button.dataset.navigation === "true" || !detail.requestId) return;
      const count = buttons.current.get(button) ?? 0;
      buttons.current.set(button, count + 1);
      if (count === 0) {
        button.setAttribute("aria-busy", "true");
        button.dataset.loading = "true";
      }
      requests.current.set(detail.requestId, button);
    };
    const end = (event: Event) => {
      const detail = (event as CustomEvent<{ requestId: string }>).detail;
      setPending((count) => Math.max(0, count - 1));
      const button = requests.current.get(detail?.requestId);
      if (!button) return;
      requests.current.delete(detail.requestId);
      const count = (buttons.current.get(button) ?? 1) - 1;
      if (count > 0) {
        buttons.current.set(button, count);
        return;
      }
      buttons.current.delete(button);
      button.removeAttribute("aria-busy");
      delete button.dataset.loading;
    };
    window.addEventListener("dropxcutz:request-start", start);
    window.addEventListener("dropxcutz:request-end", end);
    return () => {
      window.removeEventListener("dropxcutz:request-start", start);
      window.removeEventListener("dropxcutz:request-end", end);
    };
  }, []);

  if (!pending) return null;
  return (
    <div
      role="status"
      aria-label="Loading"
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 overflow-hidden bg-primary/10"
    >
      <div className="request-bar h-full w-1/3 rounded-full bg-primary" />
    </div>
  );
}
