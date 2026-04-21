"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TaxAnalysis, ExpenseCategory } from "@/lib/types";

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
      claimedDescription:
        "You've claimed mileage for business trips at the HMRC approved rate of 45p per mile.",
      adviceText:
        "Consider switching to actual cost method if your vehicle is used predominantly for business — it may yield a higher deduction.",
    },
    {
      emoji: "📱",
      name: "Phone & internet",
      claimedAmount: 420,
      claimedDescription:
        "Business proportion of your mobile phone and broadband has been deducted.",
      adviceText:
        "Ensure you're using the correct business-use percentage. If your usage has increased, recalculate.",
    },
    {
      emoji: "🏠",
      name: "Use of home",
      claimedAmount: 312,
      claimedDescription:
        "You've applied the flat rate allowance for working from home.",
      adviceText:
        "If your home office is your primary place of business, calculating actual costs (heating, electricity, council tax proportion) often gives a larger deduction.",
    },
  ],
  canImprove: [
    {
      emoji: "💻",
      name: "Equipment & technology",
      deductions: [
        { description: "Laptop / computer replacement", estimatedAmount: 1200 },
        { description: "Monitor & peripherals", estimatedAmount: 350 },
        { description: "Software subscriptions", estimatedAmount: 480 },
      ],
    },
    {
      emoji: "📚",
      name: "Training & development",
      deductions: [
        { description: "Online courses & certifications", estimatedAmount: 800 },
        { description: "Professional books & subscriptions", estimatedAmount: 150 },
      ],
    },
    {
      emoji: "🤝",
      name: "Professional services",
      deductions: [
        { description: "Accountant fees", estimatedAmount: 600 },
        { description: "Legal advice", estimatedAmount: 300 },
        { description: "Professional memberships", estimatedAmount: 254 },
      ],
    },
    {
      emoji: "🎨",
      name: "Marketing & advertising",
      deductions: [
        { description: "Website hosting & domain", estimatedAmount: 120 },
        { description: "Business cards & branding", estimatedAmount: 80 },
      ],
    },
  ],
};

function formatAmount(amount: number): string {
  return `£${amount.toLocaleString("en-GB")}`;
}

function AlreadyClaimingCard({ category }: { category: ExpenseCategory }) {
  return (
    <div className="bg-white rounded-2xl border border-black/10 p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.emoji}</span>
          <span className="text-[15px] font-semibold text-[#0c0b0a]">
            {category.name}
          </span>
        </div>
        {category.claimedAmount !== undefined && (
          <span className="chip-green text-[13px] font-semibold whitespace-nowrap">
            {formatAmount(category.claimedAmount)}
          </span>
        )}
      </div>

      {/* Claimed description */}
      {category.claimedDescription && (
        <p className="text-[13px] text-[rgba(12,11,10,0.65)] leading-relaxed">
          {category.claimedDescription}
        </p>
      )}

      {/* Advice box */}
      {category.adviceText && (
        <div className="bg-[#f9f7f5] rounded-xl p-3 flex flex-col gap-1">
          <p className="text-[12px] font-semibold text-[#0c0b0a] flex items-center gap-1">
            <span>⚡</span> Advice
          </p>
          <p className="text-[12px] text-[rgba(12,11,10,0.65)] leading-relaxed">
            {category.adviceText}
          </p>
        </div>
      )}
    </div>
  );
}

function CanImproveCard({ category }: { category: ExpenseCategory }) {
  const total =
    category.deductions?.reduce((sum, d) => sum + d.estimatedAmount, 0) ?? 0;
  return (
    <div className="bg-white rounded-2xl border border-black/10 p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">{category.emoji}</span>
        <span className="text-[15px] font-semibold text-[#0c0b0a]">
          {category.name}
        </span>
        {total > 0 && (
          <span className="ml-auto chip-orange text-[13px] font-semibold whitespace-nowrap">
            ~{formatAmount(total)}
          </span>
        )}
      </div>

      {/* Deductions box */}
      {category.deductions && category.deductions.length > 0 && (
        <div className="bg-[#ffefd3] rounded-xl p-3 flex flex-col gap-2">
          <p className="text-[12px] font-semibold text-[#0c0b0a] flex items-center gap-1">
            <span>❓</span> What you can deduct?
          </p>
          <div className="flex flex-col gap-1.5">
            {category.deductions.map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-[rgba(12,11,10,0.7)] leading-snug">
                  {d.description}
                </span>
                <span className="text-[11px] font-semibold bg-white rounded-full px-2 py-0.5 text-[#a05a00] whitespace-nowrap border border-[#f0d090]">
                  ~{formatAmount(d.estimatedAmount)}
                </span>
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
        setAnalysis(JSON.parse(stored));
      } catch {
        setAnalysis(MOCK_DATA);
      }
    } else {
      setAnalysis(MOCK_DATA);
    }
  }, []);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-[#f9f7f5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#a0d766] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* App bar */}
      <header className="sticky top-0 z-20 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push("/upload")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="rgba(12,11,10,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[13px] font-semibold text-[rgba(12,11,10,0.5)]">
          Tax Return Analysis
        </span>
        <div className="w-8" />
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* White top section */}
        <div className="bg-white px-4 pt-4 pb-6 flex flex-col gap-2">
          <p className="text-[11px] font-bold tracking-[0.12em] text-[#36893b] uppercase">
            Your tax return {analysis.taxYear}
          </p>
          <h1 className="text-[28px] font-bold text-[#0c0b0a] leading-tight">
            You could have claimed{" "}
            <span className="text-[#36893b]">
              {formatAmount(analysis.totalMissedDeductions)}
            </span>{" "}
            more
          </h1>
          {analysis.businessType && (
            <p className="text-[14px] text-[rgba(12,11,10,0.6)]">
              {analysis.incomeType} · {analysis.businessType}
            </p>
          )}
        </div>

        {/* Beige bottom section */}
        <div className="bg-[#f9f7f5] rounded-tl-[30px] rounded-tr-[30px] px-4 pt-6 pb-4 flex flex-col gap-6">
          {/* On desktop: two columns; on mobile: stacked */}
          <div className="flex flex-col xl:flex-row gap-6 xl:gap-12 xl:items-start">
            {/* LEFT column: Already claiming */}
            <div className="flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-[#0c0b0a]">
                  What you are already expensing
                </h2>
                <span className="chip-gray text-[12px]">
                  {analysis.alreadyClaiming.length} categories
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {analysis.alreadyClaiming.map((cat, i) => (
                  <AlreadyClaimingCard key={i} category={cat} />
                ))}
              </div>
            </div>

            {/* RIGHT column: Can improve */}
            <div className="flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-[#0c0b0a]">
                  What can be improved
                </h2>
                <span className="chip-gray text-[12px]">
                  {analysis.canImprove.length} categories
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {analysis.canImprove.map((cat, i) => (
                  <CanImproveCard key={i} category={cat} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-black/10 px-4 py-3 flex gap-3">
        <button
          onClick={() => router.push("/upload")}
          className="flex-1 h-12 bg-transparent text-[rgba(12,11,10,0.65)] font-medium text-[15px] rounded-[10px] hover:bg-black/5 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => {
            // Download or share — could be extended
            window.print();
          }}
          className="flex-1 h-12 bg-[#a0d766] text-[#154618] font-semibold text-[15px] rounded-[10px] hover:brightness-95 active:scale-[0.98] transition-all"
        >
          Save report
        </button>
      </div>
    </div>
  );
}
