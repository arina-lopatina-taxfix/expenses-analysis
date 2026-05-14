"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    // Disable browser scroll restoration so back/forward navigation
    // doesn't override our explicit scroll-to-top.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Skip the very first render — the loaded callback handles that pageview
    // to guarantee PostHog is initialised before it fires.
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    posthog.capture("$pageview");
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) {
      console.warn("[PostHog] NEXT_PUBLIC_POSTHOG_KEY is not set — tracking disabled");
      return;
    }

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      person_profiles: "always",
      capture_pageview: false,
      debug: process.env.NODE_ENV === "development",
      loaded: (ph) => {
        // Capture the landing pageview once we know PostHog is ready
        ph.capture("$pageview");

        // Identity bridging: parent page passes its distinct_id as ?ph_id=
        const phId = new URLSearchParams(window.location.search).get("ph_id");
        if (phId) ph.identify(phId);
      },
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}
