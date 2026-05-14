"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { usePageFlag } from "@/lib/usePageFlag";
import { pdfStore } from "@/lib/pdfStore";

const ILLUSTRATION = "/prefill-optin.png";

const STAGES = [
  "Reading your return…",
  "Checking income type…",
  "Identifying missed expenses…",
  "Comparing with similar profiles…",
  "Calculating potential refund…",
  "Preparing your summary…",
];

const NORMAL_MS = 1800; // pace during API call
const FAST_MS = 300;    // pace when API is done, flushing remaining stages

export default function AnalyzingPage() {
  const router = useRouter();
  const pageEnabled = usePageFlag("analyzing-page");
  const [activeStage, setActiveStage] = useState(0);

  // Refs so async callbacks always read current values without stale closures
  const stageRef = useRef(0);
  const destRef = useRef<string | null>(null);
  const normalTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fastTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => { track("page_viewed", { page: "analyzing" }); }, []);

  // Normal stage advancement — runs until API finishes or all stages complete
  useEffect(() => {
    if (!pageEnabled) return;
    normalTimer.current = setInterval(() => {
      setActiveStage((s) => {
        if (s >= STAGES.length - 1) {
          clearInterval(normalTimer.current!);
          normalTimer.current = null;
          return s;
        }
        const next = s + 1;
        stageRef.current = next;
        return next;
      });
    }, NORMAL_MS);
    return () => {
      if (normalTimer.current) clearInterval(normalTimer.current);
      if (fastTimer.current) clearInterval(fastTimer.current);
    };
  }, [pageEnabled]);

  // API call — when done, flush remaining stages quickly then navigate
  useEffect(() => {
    if (!pageEnabled || hasFetched.current) return;
    hasFetched.current = true;

    const finishAndNavigate = (dest: string) => {
      destRef.current = dest;

      if (stageRef.current >= STAGES.length - 1) {
        // Already at last stage — navigate after a brief pause so user sees it
        setTimeout(() => router.push(dest), 400);
        return;
      }

      // Stop normal advancement, flush remaining stages fast
      if (normalTimer.current) {
        clearInterval(normalTimer.current);
        normalTimer.current = null;
      }
      fastTimer.current = setInterval(() => {
        setActiveStage((s) => {
          const next = Math.min(s + 1, STAGES.length - 1);
          stageRef.current = next;
          if (next >= STAGES.length - 1) {
            clearInterval(fastTimer.current!);
            fastTimer.current = null;
            setTimeout(() => router.push(destRef.current!), 400);
          }
          return next;
        });
      }, FAST_MS);
    };

    async function runAnalysis() {
      try {
        const profileRaw = sessionStorage.getItem("userProfile") || "{}";
        const pdfFile = pdfStore.getFile();

        const formData = new FormData();
        if (pdfFile) formData.append("pdf", pdfFile);
        formData.append("profile", profileRaw);

        const response = await fetch("/api/analyze", { method: "POST", body: formData });

        if (!response.ok) {
          const errorText = await response.text().catch(() => `HTTP ${response.status}`);
          sessionStorage.setItem("taxAnalysis", JSON.stringify({
            isExample: true,
            errorDetail: `Request failed (${response.status}): ${errorText.slice(0, 200)}`,
          }));
          finishAndNavigate("/signup");
          return;
        }

        const analysis = await response.json();
        sessionStorage.setItem("taxAnalysis", JSON.stringify(analysis));

        const dest = analysis.isNotTaxReturn
          ? "/not-a-return"
          : analysis.isEligible !== false
          ? "/signup"
          : "/results";

        finishAndNavigate(dest);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sessionStorage.setItem("taxAnalysis", JSON.stringify({
          isExample: true,
          errorDetail: `Network error: ${msg}`,
        }));
        finishAndNavigate("/signup");
      }
    }

    runAnalysis();
  }, [pageEnabled, router]);

  if (!pageEnabled) return null;

  return (
    <main className="bg-white min-h-screen flex flex-col" style={{ marginTop: -40 }}>
      <div className="flex flex-1 flex-col items-center px-4 pt-8 pb-8">
        <div className="flex flex-col gap-[24px] items-center">
          <div className="h-[255px] relative shrink-0 w-[256px]">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={ILLUSTRATION} />
          </div>
          <div className="flex flex-col gap-[9px] items-center justify-center leading-[1.3] text-center">
            {STAGES.map((stage, i) => {
              const isActive = i === activeStage;
              return (
                <p
                  key={stage}
                  className="transition-all duration-700 relative shrink-0"
                  style={{
                    fontSize: isActive ? 28 : 16,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? "#0c0b0a" : "rgba(12,11,10,0.4)",
                    lineHeight: 1.3,
                  }}
                >
                  {stage}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
