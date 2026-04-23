"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TaxAnalysis, ExpenseCategory } from "@/lib/types";

const LOGO = "https://www.figma.com/api/mcp/asset/0f54586b-884a-43e7-ba5a-46cee4829c8b";

const MOCK_DATA: TaxAnalysis = {
  taxYear: "2024/25",
  incomeType: "Self-employed",
  businessType: "Freelance consultant",
  totalMissedDeductions: 6034,
  alreadyClaiming: [
    {
      emoji: "🚗",
      name: "Vehicle expenses",
      claimedAmount: 1240,
      claimedDescription: "Business mileage at the HMRC approved rate of 45p per mile.",
      adviceText:
        "Consider switching to actual cost method if your vehicle is used predominantly for business — it may yield a higher deduction.",
    },
    {
      emoji: "📱",
      name: "Phone & internet",
      claimedAmount: 420,
      claimedDescription: "Business proportion of mobile phone and broadband deducted.",
      adviceText:
        "Ensure you're using the correct business-use percentage. If your usage has increased, recalculate.",
    },
    {
      emoji: "🏠",
      name: "Use of home",
      claimedAmount: 312,
      claimedDescription: "HMRC flat rate of £6/week applied for working from home.",
      adviceText:
        "Calculating actual costs (heating, electricity, council tax proportion) often gives a larger deduction.",
    },
  ],
  canImprove: [
    {
      emoji: "💻",
      name: "Tech & Equipment",
      description: "Hardware and software you rely on to deliver client work.",
      adviceText: "Buy equipment outright in one tax year to claim the full cost via the Annual Investment Allowance rather than spreading depreciation.",
      deductions: [
        { description: "Laptop / computer replacement", estimatedAmount: 1200 },
        { description: "Monitor & peripherals", estimatedAmount: 350 },
        { description: "Software subscriptions", estimatedAmount: 480 },
      ],
    },
    {
      emoji: "📚",
      name: "Training",
      description: "Courses and materials that maintain or improve your current skills.",
      adviceText: "Only training that maintains existing skills is allowable — courses for a completely new career are not deductible.",
      deductions: [
        { description: "Online courses & certifications", estimatedAmount: 800 },
        { description: "Professional books & subscriptions", estimatedAmount: 150 },
      ],
    },
    {
      emoji: "📋",
      name: "Professional Services",
      description: "Fees paid to accountants, solicitors and other professionals for your business.",
      adviceText: "Your accountant's fee for preparing this Self Assessment return is itself a deductible expense — make sure it's included.",
      deductions: [
        { description: "Accountant fees", estimatedAmount: 600 },
        { description: "Legal advice", estimatedAmount: 300 },
        { description: "Professional memberships", estimatedAmount: 254 },
      ],
    },
    {
      emoji: "🎨",
      name: "Marketing & advertising",
      description: "Costs of promoting your services and maintaining an online presence.",
      adviceText: "Website costs including hosting, domain renewal and any design work are all fully deductible as business expenses.",
      deductions: [
        { description: "Website hosting & domain", estimatedAmount: 120 },
        { description: "Business cards & branding", estimatedAmount: 80 },
      ],
    },
  ],
};

function fmt(n: number | string | undefined): string {
  const num = Number(n);
  if (n == null || n === "" || isNaN(num)) return "£0";
  return `£${num.toLocaleString("en-GB")}`;
}

function recalcTotal(canImprove: ExpenseCategory[]): number {
  return canImprove.reduce(
    (sum, cat) => sum + (cat.deductions?.reduce((s, d) => s + (Number(d.estimatedAmount) || 0), 0) ?? 0),
    0
  );
}

const FA_ICON_STYLE: React.CSSProperties = {
  fontFamily: "'Font Awesome 7 Free'",
  fontWeight: 400,
  fontStyle: "normal",
};

function FaIcon({ glyph, className }: { glyph: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className ?? "shrink-0 text-[16px] leading-[20px] w-[20px] text-center inline-block"}
      style={FA_ICON_STYLE}
    >
      {glyph}
    </span>
  );
}

function AmountChip({ text, bg = "#f4f1f1" }: { text: string; bg?: string }) {
  return (
    <span
      className="flex items-center h-[32px] px-[8px] rounded-[8px] text-[14px] whitespace-nowrap shrink-0"
      style={{ background: bg, color: "rgba(12,11,10,0.8)", fontWeight: 400 }}
    >
      {text}
    </span>
  );
}

function AlreadyClaimingCard({ category }: { category: ExpenseCategory }) {
  return (
    <div className="flex gap-[16px] items-center p-[16px] relative w-full">
      <div
        className="absolute bg-white inset-0 rounded-[16px]"
        style={{ border: "1px solid rgba(12,11,10,0.08)" }}
      />
      {/* LEFT: name + amount chip stacked */}
      <div className="flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-0 relative">
        <p
          className="overflow-hidden text-ellipsis text-[16px] text-[#0c0b0a] leading-[20px] w-full"
          style={{ fontWeight: 500 }}
        >
          {category.emoji} {category.name}
        </p>
        {category.claimedAmount !== undefined && (
          <AmountChip text={fmt(category.claimedAmount)} />
        )}
      </div>
      {/* RIGHT: advice box */}
      {category.adviceText && (
        <div
          className="bg-[#f9f7f5] flex flex-[1_0_0] flex-col min-w-0 p-[14px] rounded-[12px] relative"
          style={{ gap: 2 }}
        >
          <div className="flex gap-[6px] items-start">
            <FaIcon glyph={''} />
            <p
              className="text-[14px] text-[#0c0b0a] leading-[20px]"
              style={{ fontWeight: 700, letterSpacing: "-0.14px" }}
            >
              Advice
            </p>
          </div>
          <p className="text-[14px] text-[rgba(12,11,10,0.65)] leading-[1.5]">
            {category.adviceText}
          </p>
        </div>
      )}
    </div>
  );
}

function CanImproveCard({ category }: { category: ExpenseCategory }) {
  return (
    <div className="flex gap-[24px] items-center p-[16px] relative w-full">
      <div
        className="absolute bg-white inset-0 rounded-[16px]"
        style={{ border: "1px solid rgba(12,11,10,0.08)" }}
      />
      {/* LEFT: name + description + advice box */}
      <div className="flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-0 relative">
        <div className="flex flex-col gap-[10px] items-start w-full">
          <p
            className="overflow-hidden text-ellipsis text-[16px] text-[#0c0b0a] leading-[20px] w-full"
            style={{ fontWeight: 500 }}
          >
            {category.emoji} {category.name}
          </p>
          {category.description && (
            <p className="text-[14px] text-[rgba(12,11,10,0.65)] leading-[1.5] w-full">
              {category.description}
            </p>
          )}
        </div>
        {category.adviceText && (
          <div
            className="bg-[#f9f7f5] flex flex-col p-[14px] rounded-[12px] w-full"
            style={{ gap: 2 }}
          >
            <div className="flex gap-[6px] items-start">
              <FaIcon glyph={''} />
              <p
                className="text-[14px] text-[#0c0b0a] leading-[20px]"
                style={{ fontWeight: 700, letterSpacing: "-0.14px" }}
              >
                Advice
              </p>
            </div>
            <p className="text-[14px] text-[rgba(12,11,10,0.65)] leading-[1.5]">
              {category.adviceText}
            </p>
          </div>
        )}
      </div>
      {/* Vertical divider */}
      {category.deductions && category.deductions.length > 0 && (
        <div className="flex items-center self-stretch relative shrink-0">
          <div className="w-px h-full" style={{ background: "rgba(12,11,10,0.1)" }} />
        </div>
      )}
      {/* RIGHT: deductions list (no background) */}
      {category.deductions && category.deductions.length > 0 && (
        <div className="flex flex-[1_0_0] flex-col min-w-0 relative" style={{ gap: 8 }}>
          <div className="flex gap-[6px] items-start">
            <FaIcon glyph={''} />
            <p
              className="text-[14px] text-[#0c0b0a] leading-[20px]"
              style={{ fontWeight: 700, letterSpacing: "-0.14px" }}
            >
              What you can deduct?
            </p>
          </div>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {category.deductions.map((d, i) => (
              <div key={i} className="flex items-center justify-between w-full">
                <span className="text-[14px] text-[rgba(12,11,10,0.65)] leading-[1.5]">
                  {d.description}
                </span>
                <AmountChip text={`~${fmt(d.estimatedAmount)}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<TaxAnalysis | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("taxAnalysis");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const base = (!parsed.alreadyClaiming || !parsed.canImprove)
          ? { ...MOCK_DATA, ...parsed }
          : parsed;
        setAnalysis({ ...base, totalMissedDeductions: recalcTotal(base.canImprove ?? []) });
      } catch {
        setAnalysis(MOCK_DATA);
      }
    } else {
      setAnalysis(MOCK_DATA);
    }
  }, []);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#a0d766] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* App bar */}
      <header
        className="sticky top-0 z-20 bg-white flex items-center justify-center px-[64px]"
        style={{
          height: 75,
          boxShadow: "0px 0px 2px 0px rgba(0,0,0,0.08), 2px 4px 16px 0px rgba(0,0,0,0.08)",
        }}
      >
        <img src={LOGO} alt="Taxfix" className="h-[27px] w-[96px] object-contain" />
      </header>

      {/* Example data banner */}
      {analysis.isExample && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-amber-800 text-[13px]">
            ⚠️ Showing example data — your PDF was not analysed.
            {analysis.errorDetail && (
              <span className="block text-amber-700 text-[11px] mt-0.5 opacity-80">
                {analysis.errorDetail}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 80 }}>
        {/* White header section */}
        <div
          className="flex flex-col items-center text-center px-6"
          style={{ paddingTop: 45, paddingBottom: 36, gap: 6 }}
        >
          <p
            className="text-[12px] text-[#36893b] text-center w-full"
            style={{ fontWeight: 400, lineHeight: 1.3 }}
          >
            YOUR TAX RETURN {analysis.taxYear}
          </p>
          <h1 className="text-[30px] text-black whitespace-nowrap" style={{ fontWeight: 700, lineHeight: 1.2 }}>
            You could have claimed{" "}
            <span style={{ color: "#36893b" }}>{fmt(analysis.totalMissedDeductions)}</span>
            {" "}more
          </h1>
          <p
            className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3] text-center"
            style={{ maxWidth: 600 }}
          >
            {analysis.businessType
              ? `We compared your SA103 return against ${analysis.businessType} with similar turnover. Here's what's on your return — and what you missed.`
              : "Here's what's on your return — and what you missed."}
          </p>
        </div>

        {/* Beige content section */}
        <div
          className="px-4 xl:px-16"
          style={{
            background: "#f9f7f5",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingTop: 51,
            paddingBottom: 48,
          }}
        >
          <div
            className="flex flex-col mx-auto"
            style={{ gap: 48, maxWidth: 900 }}
          >
            {/* Section 1 — Already expensing */}
            <div className="flex flex-col w-full" style={{ gap: 16 }}>
              <div className="flex items-center justify-between w-full">
                <h2
                  className="text-[20px] text-black whitespace-nowrap"
                  style={{ fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.2px" }}
                >
                  What you are already expensing
                </h2>
                <span
                  className="flex items-center h-[32px] px-[8px] rounded-[8px] text-[14px] whitespace-nowrap bg-white shrink-0"
                  style={{ color: "rgba(12,11,10,0.8)" }}
                >
                  {analysis.alreadyClaiming.length} categories
                </span>
              </div>
              <div className="flex flex-col" style={{ gap: 12 }}>
                {analysis.alreadyClaiming.map((cat, i) => (
                  <AlreadyClaimingCard key={i} category={cat} />
                ))}
              </div>
            </div>

            {/* Section 2 — Can improve */}
            <div className="flex flex-col w-full" style={{ gap: 16 }}>
              <div className="flex items-center justify-between w-full">
                <h2
                  className="text-[20px] text-black whitespace-nowrap"
                  style={{ fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.2px" }}
                >
                  What can be improved
                </h2>
                <span
                  className="flex items-center h-[32px] px-[8px] rounded-[8px] text-[14px] whitespace-nowrap bg-white shrink-0"
                  style={{ color: "rgba(12,11,10,0.8)" }}
                >
                  {analysis.canImprove.length} categories
                </span>
              </div>
              <div className="flex flex-col" style={{ gap: 12 }}>
                {analysis.canImprove.map((cat, i) => (
                  <CanImproveCard key={i} category={cat} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-white"
        style={{ height: 80, borderTop: "1px solid #f2efed" }}
      >
        <button
          onClick={() => router.push("/upload")}
          className="absolute flex gap-[8px] items-center left-[39px] top-1/2 -translate-y-1/2 text-[#154618] text-[16px] hover:opacity-70 transition-opacity"
          style={{ fontWeight: 500 }}
        >
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <path d="M13 16l-6-6 6-6" stroke="#154618" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="absolute bg-[#a0d766] h-[48px] right-[20px] top-1/2 -translate-y-1/2 rounded-[10px] w-[177px] text-[#154618] text-[16px] hover:brightness-95 active:scale-[0.98] transition-all"
          style={{ fontWeight: 600 }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
