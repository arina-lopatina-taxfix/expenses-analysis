"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const STAGES = [
  "Reading your return...",
  "Identifying missed expenses...",
  "Calculating potential refund...",
];

export default function AnalyzingPage() {
  const router = useRouter();
  const [activeStage, setActiveStage] = useState(0);
  const hasFetched = useRef(false);

  // Cycle through stages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((s) => (s + 1) % STAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Trigger API call once
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
          throw new Error("Analysis failed");
        }

        const analysis = await response.json();
        sessionStorage.setItem("taxAnalysis", JSON.stringify(analysis));
        router.push("/results");
      } catch {
        // On error fall through to results with any data that may have been stored
        // or let the results page handle missing data
        router.push("/results");
      }
    }

    runAnalysis();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#f9f7f5] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        {/* File cabinet illustration */}
        <div className="w-44 h-44 flex items-center justify-center">
          <FileCabinetIllustration />
        </div>

        {/* Animated stage text */}
        <div className="flex flex-col gap-4 text-center w-full">
          {STAGES.map((stage, i) => {
            const isActive = i === activeStage;
            return (
              <p
                key={stage}
                className={`transition-all duration-700 ${
                  isActive
                    ? "text-[28px] font-bold text-[#0c0b0a] opacity-100"
                    : "text-[16px] font-normal text-[#0c0b0a] opacity-40"
                }`}
              >
                {stage}
              </p>
            );
          })}
        </div>

        {/* Animated progress dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-500 ${
                i === activeStage % 3
                  ? "w-6 h-2 bg-[#a0d766]"
                  : "w-2 h-2 bg-[#a0d766]/30"
              }`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function FileCabinetIllustration() {
  return (
    <svg viewBox="0 0 176 176" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Cabinet body */}
      <rect x="32" y="40" width="112" height="120" rx="8" fill="#e8f5d0" stroke="#a0d766" strokeWidth="2" />

      {/* Top drawer */}
      <rect x="40" y="52" width="96" height="36" rx="6" fill="white" stroke="#c8e89a" strokeWidth="1.5" />
      <rect x="72" y="66" width="32" height="8" rx="4" fill="#a0d766" />

      {/* Middle drawer */}
      <rect x="40" y="96" width="96" height="36" rx="6" fill="white" stroke="#c8e89a" strokeWidth="1.5" />
      <rect x="72" y="110" width="32" height="8" rx="4" fill="#a0d766" />

      {/* Bottom drawer */}
      <rect x="40" y="140" width="96" height="12" rx="6" fill="white" stroke="#c8e89a" strokeWidth="1.5" />

      {/* Top cabinet edge */}
      <rect x="28" y="32" width="120" height="12" rx="6" fill="#c8e89a" />

      {/* Papers sticking out of top drawer - animated feel */}
      <rect x="56" y="40" width="8" height="16" rx="2" fill="white" stroke="#d0e8b0" strokeWidth="1" />
      <rect x="68" y="38" width="8" height="18" rx="2" fill="white" stroke="#d0e8b0" strokeWidth="1" />
      <rect x="80" y="42" width="8" height="14" rx="2" fill="#ffefd3" stroke="#ffd090" strokeWidth="1" />
      <rect x="92" y="39" width="8" height="17" rx="2" fill="white" stroke="#d0e8b0" strokeWidth="1" />
      <rect x="104" y="41" width="8" height="15" rx="2" fill="white" stroke="#d0e8b0" strokeWidth="1" />

      {/* Magnifying glass */}
      <circle cx="136" cy="60" r="16" fill="#a0d766" />
      <circle cx="134" cy="57" r="8" stroke="white" strokeWidth="2" fill="none" />
      <line x1="140" y1="63" x2="147" y2="70" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

      {/* Sparkles */}
      <path d="M20 30 L22 24 L24 30 L30 32 L24 34 L22 40 L20 34 L14 32 Z" fill="#a0d766" opacity="0.6" />
      <path d="M148 28 L149.5 24 L151 28 L155 29.5 L151 31 L149.5 35 L148 31 L144 29.5 Z" fill="#a0d766" opacity="0.5" />
      <circle cx="32" cy="148" r="4" fill="#a0d766" opacity="0.4" />
      <circle cx="148" cy="140" r="3" fill="#ffefd3" opacity="0.8" stroke="#a0d766" strokeWidth="1" />
    </svg>
  );
}
