"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const LOGO = "/logo.png";
const ILLUSTRATION = "https://www.figma.com/api/mcp/asset/9e612669-f595-4428-ad88-9ceacf67ca90";

const STAGES = [
  "Reading your return…",
  "Identifying missed expenses…",
  "Calculating potential refund…",
];

export default function AnalyzingPage() {
  const router = useRouter();
  const [activeStage, setActiveStage] = useState(0);
  const hasFetched = useRef(false);

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
        const pdfBase64 = sessionStorage.getItem("pdfBase64");
        const profileRaw = sessionStorage.getItem("userProfile") || "{}";
        const pdfName = sessionStorage.getItem("pdfName") || "tax-return.pdf";

        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfBase64,
            pdfName,
            profile: JSON.parse(profileRaw),
          }),
        });

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
        router.push("/signup");
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
    <main className="bg-white relative min-h-screen">
      {/* Logo */}
      <div className="-translate-x-1/2 absolute h-[27px] left-1/2 top-[32px] w-[96px]">
        <img alt="Taxfix" className="h-[23px] w-[96px] object-contain" src={LOGO} />
      </div>

      {/* Content */}
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col gap-[24px] items-center left-1/2 top-[calc(50%+19.5px)]">
        <div className="h-[255px] relative shrink-0 w-[256px]">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={ILLUSTRATION} />
        </div>
        <div className="flex flex-col gap-[9px] items-center justify-center leading-[1.3] text-center whitespace-nowrap">
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
    </main>
  );
}
