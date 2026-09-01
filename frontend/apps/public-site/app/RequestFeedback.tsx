"use client";
import { useEffect, useState } from "react";

export default function RequestFeedback() {
  const [pending, setPending] = useState(0);
  useEffect(() => {
    let button: HTMLButtonElement | null = null;
    const click = (event: MouseEvent) => { const target = event.target; button = target instanceof Element ? target.closest("button") : null; };
    const start = () => { setPending((value) => value + 1); if (button && !button.disabled) { button.disabled = true; button.dataset.requestBusy = "true"; button.dataset.requestOriginal = button.innerHTML; button.textContent = "Saving..."; } };
    const end = () => { setPending((value) => Math.max(0, value - 1)); if (button?.dataset.requestBusy === "true") { button.disabled = false; button.innerHTML = button.dataset.requestOriginal ?? button.innerHTML; delete button.dataset.requestBusy; delete button.dataset.requestOriginal; } button = null; };
    document.addEventListener("click", click, true); window.addEventListener("dropxcutz:request-start", start); window.addEventListener("dropxcutz:request-end", end);
    return () => { document.removeEventListener("click", click, true); window.removeEventListener("dropxcutz:request-start", start); window.removeEventListener("dropxcutz:request-end", end); };
  }, []);
  if (!pending) return null;
  return null;
}
