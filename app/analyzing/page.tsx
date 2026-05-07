"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { usePageFlag } from "@/lib/usePageFlag";
import { pdfStore } from "@/lib/pdfStore";

const ILLUSTRATION = "/prefill-optin.png";

const STAGES = [
  "Reading your return…",
  "Identifying missed expenses…",
  "Calculating potential refund…",
];

export default function AnalyzingPage() {
  const router = useRouter();
  const pageEnabled = usePageFlag("analyzing-page");
  const [activeStage, setActiveStage] = useState(0);
  const hasFetched = useRef(false);

  useEffect(() => { track("page_viewed", { page: "analyzing" }); }, []);

  if (!pageEnabled) return null;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((s) => (s + 1) % STAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

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
          router.push("/signup");
          return;
        }

        const analysis = await response.json();
        sessionStorage.setItem("taxAnalysis", JSON.stringify(analysis));
        router.push(analysis.isEligible !== false ? "/signup" : "/results");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sessionStorage.setItem("taxAnalysis", JSON.stringify({
          isExample: true,
          errorDetail: `Network error: ${msg}`,
        }));
        router.push("/signup");
      }
    }

    runAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="bg-white min-h-screen flex flex-col">
      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
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
