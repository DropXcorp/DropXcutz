"use client";

import { useERPStore } from "./erp-store";

export const hasFeature = (features: string[], code: string) => features.includes(code);
export function useFeature(code: string): boolean {
  return useERPStore((state) => hasFeature(state.features, code));
}
