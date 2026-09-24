"use client";
import { useEffect, useState } from "react";

export default function RequestFeedback() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const onStart = () => setPending((count) => count + 1);
    const onEnd = () => setPending((count) => Math.max(0, count - 1));
    window.addEventListener("dropxcutz:request-start", onStart);
    window.addEventListener("dropxcutz:request-end", onEnd);
    return () => {
      window.removeEventListener("dropxcutz:request-start", onStart);
      window.removeEventListener("dropxcutz:request-end", onEnd);
    };
  }, []);

  if (!pending) return null;

  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-x-0 top-0 z-[200] h-0.5 animate-pulse bg-blue-600"
    />
  );
}
