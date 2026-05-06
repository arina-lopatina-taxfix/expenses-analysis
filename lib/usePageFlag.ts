"use client";

import { useFeatureFlagEnabled } from "posthog-js/react";

/**
 * Returns true when the page should render.
 * - Flag undefined (PostHog loading / not configured) → show page
 * - Flag true  → show page
 * - Flag false → hide page (caller should redirect or return null)
 */
export function usePageFlag(flagKey: string): boolean {
  const enabled = useFeatureFlagEnabled(flagKey);
  return enabled !== false;
}
