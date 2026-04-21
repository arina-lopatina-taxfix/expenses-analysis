"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const LOGO = "https://www.figma.com/api/mcp/asset/3517c808-5b26-433b-ae8b-e45d365ca4c3";
const ILLUSTRATION = "https://www.figma.com/api/mcp/asset/3aa546ad-ecf7-402b-aded-a6b33d1b5cab";

const STAGES = [
  "Reading your return…",
  "Identifying missed expenses…",
  "Calculating potential refund…",
];

export default function AnalyzingPage() {
  const router = useRouter();
  const [activeStage, setActiveStage] = useState(1);
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

        if (!response.ok) throw new Error("Analysis failed");

        const analysis = await response.json();
        sessionStorage.setItem("taxAnalysis", JSON.stringify(analysis));
        router.push("/results");
      } catch {
        router.push("/results");
      }
    }

    runAnalysis();
  }, [router]);

  return (
    <main className="min-h-screen bg-white relative flex flex-col">
      {/* Logo — absolute top center */}
      <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none">
        <img src={LOGO} alt="Taxfix" className="h-[27px] w-[96px] object-contain" />
      </div>

      {/* Content centered, offset slightly below center */}
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{ paddingTop: 39 /* 19.5px * 2 to offset center downward */ }}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Illustration */}
          <img
            src={ILLUSTRATION}
            alt=""
            aria-hidden
            className="object-contain"
            style={{ width: 256, height: 255 }}
          />

          {/* Animated text stages */}
          <div
            className="flex flex-col items-center text-center"
            style={{ gap: 9 }}
          >
            {STAGES.map((stage, i) => {
              const isActive = i === activeStage;
              return (
                <p
                  key={stage}
                  className="transition-all duration-700 whitespace-nowrap"
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
