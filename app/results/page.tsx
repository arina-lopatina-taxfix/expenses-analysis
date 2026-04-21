"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TaxAnalysis, ExpenseCategory } from "@/lib/types";

const LOGO = "https://www.figma.com/api/mcp/asset/ab431d81-bc37-4d25-ac54-3eb0871dd297";

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

function fmt(n: number) {
  return `£${n.toLocaleString("en-GB")}`;
}

function AlreadyClaimingCard({ category }: { category: ExpenseCategory }) {
  return (
    <div
      className="bg-white flex flex-col"
      style={{ borderRadius: 16, padding: 16, gap: 12, border: "1px solid rgba(12,11,10,0.08)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{category.emoji}</span>
          <span
            className="text-[16px] text-[#0c0b0a]"
            style={{ fontWeight: 500, lineHeight: "20px" }}
          >
            {category.name}
          </span>
        </div>
        {category.claimedAmount !== undefined && (
          <span
            className="inline-flex items-center px-3 text-[13px] rounded-full whitespace-nowrap"
            style={{
              height: 28,
              background: "rgba(160,215,102,0.2)",
              color: "#36893b",
              fontWeight: 600,
            }}
          >
            {fmt(category.claimedAmount)}
          </span>
        )}
      </div>

      {/* Description */}
      {category.claimedDescription && (
        <p
          className="text-[14px] text-[rgba(12,11,10,0.8)]"
          style={{ lineHeight: "20px" }}
        >
          {category.claimedDescription}
        </p>
      )}

      {/* Advice box */}
      {category.adviceText && (
        <div
          className="flex flex-col"
          style={{
            background: "#f9f7f5",
            borderRadius: 12,
            padding: 14,
            gap: 4,
          }}
        >
          <p
            className="flex items-center gap-1.5 text-[14px] text-[#0c0b0a]"
            style={{ fontWeight: 700, lineHeight: "20px" }}
          >
            <span>⚡</span> Advice
          </p>
          <p
            className="text-[14px] text-[rgba(12,11,10,0.8)]"
            style={{ lineHeight: "20px" }}
          >
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
    <div
      className="bg-white flex flex-col"
      style={{ borderRadius: 16, padding: 16, gap: 12, border: "1px solid rgba(12,11,10,0.08)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none">{category.emoji}</span>
        <span
          className="text-[16px] text-[#0c0b0a]"
          style={{ fontWeight: 500, lineHeight: "20px" }}
        >
          {category.name}
        </span>
        {total > 0 && (
          <span
            className="ml-auto inline-flex items-center px-3 text-[13px] rounded-full whitespace-nowrap"
            style={{
              height: 28,
              background: "#ffefd3",
              color: "#a05a00",
              fontWeight: 600,
            }}
          >
            ~{fmt(total)}
          </span>
        )}
      </div>

      {/* Deductions box */}
      {category.deductions && category.deductions.length > 0 && (
        <div
          className="flex flex-col"
          style={{ background: "#ffefd3", borderRadius: 12, padding: 14, gap: 8 }}
        >
          <p
            className="flex items-center gap-1.5 text-[14px] text-[#0c0b0a]"
            style={{ fontWeight: 700, lineHeight: "20px" }}
          >
            <span>❓</span> What you can deduct?
          </p>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {category.deductions.map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span
                  className="text-[14px] text-[rgba(12,11,10,0.8)]"
                  style={{ lineHeight: "20px" }}
                >
                  {d.description}
                </span>
                <span
                  className="inline-flex items-center px-2 text-[12px] rounded-full whitespace-nowrap flex-shrink-0"
                  style={{
                    height: 24,
                    background: "white",
                    color: "#a05a00",
                    fontWeight: 600,
                    border: "1px solid #f0d090",
                  }}
                >
                  ~{fmt(d.estimatedAmount)}
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#a0d766] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* App bar */}
      <header
        className="sticky top-0 z-20 bg-white flex items-center justify-center px-10"
        style={{
          height: 75,
          boxShadow: "0px 2px 4px rgba(0,0,0,0.08), 0px 0px 2px rgba(0,0,0,0.08)",
        }}
      >
        <img src={LOGO} alt="Taxfix" className="h-[27px] w-[96px] object-contain" />
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 80 }}>
        {/* White header section */}
        <div
          className="flex flex-col items-center text-center px-6"
          style={{ paddingTop: 32, paddingBottom: 32, gap: 8 }}
        >
          <p
            className="uppercase tracking-widest text-[#36893b] text-[12px]"
            style={{ fontWeight: 400, letterSpacing: "0.1em" }}
          >
            Your tax return {analysis.taxYear}
          </p>
          <h1
            className="text-[30px] text-[#0c0b0a]"
            style={{ fontWeight: 700, lineHeight: "1.2", maxWidth: 600 }}
          >
            You could have claimed{" "}
            <span style={{ color: "#36893b" }}>{fmt(analysis.totalMissedDeductions)}</span> more
          </h1>
          {analysis.businessType && (
            <p className="text-[14px] text-[rgba(12,11,10,0.6)]">
              {analysis.incomeType} · {analysis.businessType}
            </p>
          )}
        </div>

        {/* Beige content section */}
        <div
          className="px-4 xl:px-16"
          style={{
            background: "#f9f7f5",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingTop: 32,
            paddingBottom: 32,
          }}
        >
          {/* Two column layout */}
          <div
            className="flex flex-col xl:flex-row xl:items-start mx-auto"
            style={{ gap: 53, maxWidth: 1051 }}
          >
            {/* LEFT — Already expensing */}
            <div className="flex flex-col flex-1" style={{ gap: 16 }}>
              <div className="flex items-center justify-between">
                <h2
                  className="text-[20px] text-[#0c0b0a]"
                  style={{ fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.2px" }}
                >
                  What you are already expensing
                </h2>
                <span
                  className="inline-flex items-center px-3 text-[13px] rounded-lg whitespace-nowrap bg-white"
                  style={{
                    height: 32,
                    color: "rgba(12,11,10,0.65)",
                    border: "1px solid rgba(12,11,10,0.1)",
                    fontWeight: 500,
                  }}
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

            {/* RIGHT — Can improve */}
            <div className="flex flex-col flex-1" style={{ gap: 16 }}>
              <div className="flex items-center justify-between">
                <h2
                  className="text-[20px] text-[#0c0b0a]"
                  style={{ fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.2px" }}
                >
                  What can be improved
                </h2>
                <span
                  className="inline-flex items-center px-3 text-[13px] rounded-lg whitespace-nowrap bg-white"
                  style={{
                    height: 32,
                    color: "rgba(12,11,10,0.65)",
                    border: "1px solid rgba(12,11,10,0.1)",
                    fontWeight: 500,
                  }}
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

      {/* Sticky footer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-white flex items-center justify-between px-10"
        style={{
          height: 80,
          borderTop: "1px solid #f4f1f1",
        }}
      >
        <button
          onClick={() => router.push("/upload")}
          className="flex items-center gap-2 text-[#154618] text-[16px] transition-colors hover:opacity-70"
          style={{ fontWeight: 500 }}
        >
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <path d="M13 16l-6-6 6-6" stroke="#154618" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="h-12 bg-[#a0d766] text-[#154618] text-[16px] rounded-[10px] hover:brightness-95 active:scale-[0.98] transition-all"
          style={{ width: 177, fontWeight: 600 }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
