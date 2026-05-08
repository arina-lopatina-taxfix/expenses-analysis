"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    posthog.capture("$pageview");
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      // 'always' creates person profiles for anonymous users so we can
      // track drop-off by person across the funnel.
      person_profiles: "always",
      capture_pageview: false, // fired manually on route changes via PageviewTracker
    });

    // Identity bridging: when this app runs embedded, the parent page passes
    // its PostHog distinct_id as ?ph_id= so we can link sessions.
    const phId = new URLSearchParams(window.location.search).get("ph_id");
    if (phId) {
      posthog.identify(phId);
    }
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
