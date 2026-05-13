"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";

const ILLUSTRATION = "/list-tasks.png";

export default function FixPage() {
  const [taxYear, setTaxYear] = useState<string | null>(null);

  useEffect(() => {
    track("page_viewed", { page: "fix" });
    try {
      const stored = sessionStorage.getItem("taxAnalysis");
      if (stored) {
        const parsed = JSON.parse(stored);
        setTaxYear(parsed.taxYear ?? null);
      }
    } catch { /* ignore */ }
  }, []);

  const isCurrentYear = taxYear === "2024/25";

  return (
    <main className="bg-white min-h-screen flex flex-col items-center px-4 pt-10" style={{ marginTop: -40 }}>
      <div className="flex flex-col gap-[24px] items-center w-full max-w-[560px]">
        {/* Illustration */}
        <div className="relative shrink-0" style={{ width: 250, height: 250 }}>
          <img
            alt=""
            className="absolute inset-0 object-cover size-full pointer-events-none"
            src={ILLUSTRATION}
          />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-[6px] items-center text-center">
          <p className="text-[30px] text-black leading-[1.2] text-center" style={{ fontWeight: 700 }}>
            Don&apos;t leave money on the table
          </p>
          <p className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3] text-center" style={{ maxWidth: 514 }}>
            {isCurrentYear
              ? "If you filed your tax return within the last 12 months, you may still be able to amend it and get more money back. Chat with our team to figure out the next steps, or file your next return with us to help make sure you claim everything you're entitled to."
              : "File your next tax return with us to get help from an accredited tax accountant and make sure you claim everything you're entitled to."}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-[8px] items-center w-full max-w-[300px]">
          {isCurrentYear ? (
            <>
              <a
                href="https://calendly.com/nik-sheth-taxfix/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-[48px] w-full rounded-[10px] text-[16px] text-[#154618]"
                style={{ background: "#a0d766", fontWeight: 500 }}
              >
                Get help with amendment
              </a>
              <a
                href="https://staging.taxfix.tech/en-uk/assessment/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-[48px] w-full text-[16px] text-[#154618] hover:opacity-70 transition-opacity"
                style={{ fontWeight: 500 }}
              >
                File my tax return
              </a>
            </>
          ) : (
            <a
              href="https://staging.taxfix.tech/en-uk/assessment/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-[48px] w-full rounded-[10px] text-[16px] text-[#154618]"
              style={{ background: "#a0d766", fontWeight: 500 }}
            >
              File my tax return
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
