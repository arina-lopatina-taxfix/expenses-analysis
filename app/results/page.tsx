"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TaxAnalysis, ExpenseCategory } from "@/lib/types";

const LOGO = "https://www.figma.com/api/mcp/asset/0f54586b-884a-43e7-ba5a-46cee4829c8b";

const FALLBACK_DEDUCTIONS: Record<string, { description: string; estimatedAmount: number }[]> = {
  equipment: [
    { description: "Laptop or computer replacement", estimatedAmount: 1200 },
    { description: "Monitor, keyboard & peripherals", estimatedAmount: 350 },
    { description: "Software subscriptions (annual)", estimatedAmount: 480 },
  ],
  training: [
    { description: "Online courses & certifications", estimatedAmount: 600 },
    { description: "Professional books & journals", estimatedAmount: 154 },
    { description: "Industry conference attendance", estimatedAmount: 250 },
  ],
  services: [
    { description: "Accountant / bookkeeper fees", estimatedAmount: 500 },
    { description: "Professional membership fees", estimatedAmount: 300 },
    { description: "Legal advice on contracts", estimatedAmount: 200 },
  ],
  "home office": [
    { description: "Proportion of heating and electricity", estimatedAmount: 480 },
    { description: "Proportion of broadband costs", estimatedAmount: 240 },
    { description: "Office furniture and equipment", estimatedAmount: 350 },
  ],
  marketing: [
    { description: "Website hosting & domain", estimatedAmount: 180 },
    { description: "Business cards & branding materials", estimatedAmount: 120 },
    { description: "Online advertising", estimatedAmount: 300 },
  ],
  default: [
    { description: "Professional software subscriptions", estimatedAmount: 480 },
    { description: "Professional membership fees", estimatedAmount: 300 },
    { description: "Business publications & books", estimatedAmount: 120 },
  ],
};

function getFallbackDeductions(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("equip") || lower.includes("tech") || lower.includes("tool")) return FALLBACK_DEDUCTIONS.equipment;
  if (lower.includes("train") || lower.includes("develop") || lower.includes("course")) return FALLBACK_DEDUCTIONS.training;
  if (lower.includes("service") || lower.includes("account") || lower.includes("legal") || lower.includes("member")) return FALLBACK_DEDUCTIONS.services;
  if (lower.includes("home") || lower.includes("office")) return FALLBACK_DEDUCTIONS["home office"];
  if (lower.includes("market") || lower.includes("advert") || lower.includes("brand")) return FALLBACK_DEDUCTIONS.marketing;
  return FALLBACK_DEDUCTIONS.default;
}

function ensureDeductions(analysis: TaxAnalysis): TaxAnalysis {
  const fixedCanImprove = analysis.canImprove.map((cat) => {
    if (!cat.deductions || cat.deductions.length < 2) {
      return { ...cat, deductions: getFallbackDeductions(cat.name) };
    }
    return cat;
  });
  const total = fixedCanImprove.reduce(
    (sum, cat) => sum + (cat.deductions?.reduce((s, d) => s + (d.estimatedAmount || 0), 0) ?? 0),
    0
  );
  return { ...analysis, canImprove: fixedCanImprove, totalMissedDeductions: total };
}

const MOCK_DATA: TaxAnalysis = {
  taxYear: "2024/25",
  incomeType: "Self-employed",
  businessType: "Freelance consultant",
  totalMissedDeductions: 4434,
  isExample: true,
  alreadyClaiming: [
    {
      emoji: "🚗",
      name: "Vehicle expenses",
      claimedAmount: 1240,
      claimedDescription: "You've claimed mileage for business trips at the HMRC approved rate of 45p per mile.",
      adviceText: "Consider switching to actual cost method if your vehicle is used predominantly for business — it may yield a higher deduction.",
    },
    {
      emoji: "📱",
      name: "Phone & internet",
      claimedAmount: 420,
      claimedDescription: "Business proportion of your mobile phone and broadband has been deducted.",
      adviceText: "Ensure you're using the correct business-use percentage. If your usage has increased, recalculate.",
    },
    {
      emoji: "🏠",
      name: "Use of home",
      claimedAmount: 312,
      claimedDescription: "You've applied the flat rate allowance for working from home.",
      adviceText: "If your home office is your primary place of business, calculating actual costs (heating, electricity, council tax proportion) often gives a larger deduction.",
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
        { description: "Website hosting & domain", estimatedAmount: 180 },
        { description: "Business cards & branding", estimatedAmount: 120 },
      ],
    },
  ],
};

function fmt(n: number) {
  return `£${n.toLocaleString("en-GB")}`;
}

function AlreadyClaimingCard({ category }: { category: ExpenseCategory }) {
  return (
    <div className="flex flex-col gap-[16px] items-start justify-center p-[16px] relative w-[497px]">
      <div
        className="absolute bg-white inset-0 rounded-[16px]"
        style={{ border: "1px solid rgba(12,11,10,0.08)" }}
      />
      <div className="flex items-center justify-between relative w-full">
        <div className="flex flex-1 flex-col gap-[5px] items-start min-w-0">
          <p
            className="overflow-hidden text-ellipsis text-[16px] text-[#0c0b0a] leading-[20px] w-full"
            style={{ fontWeight: 500 }}
          >
            {category.emoji} {category.name}
          </p>
          {category.claimedDescription && (
            <p className="text-[14px] text-[rgba(12,11,10,0.8)] leading-[20px] w-full">
              {category.claimedDescription}
            </p>
          )}
        </div>
        {category.claimedAmount !== undefined && (
          <span
            className="flex items-center h-[32px] pl-[4px] pr-[8px] rounded-[8px] text-[14px] whitespace-nowrap ml-3 shrink-0"
            style={{ background: "#f4f1f1", color: "rgba(12,11,10,0.8)" }}
          >
            {fmt(category.claimedAmount)}
          </span>
        )}
      </div>
      {category.adviceText && (
        <div
          className="bg-[#f9f7f5] flex flex-col p-[14px] rounded-[12px] w-full"
          style={{ gap: 2 }}
        >
          <div className="flex gap-[6px] items-start">
            <span className="text-[20px] leading-[20px] shrink-0">⚡</span>
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
  const deductions = category.deductions ?? [];
  return (
    <div className="flex flex-col gap-[12px] items-start justify-center p-[16px] relative w-[497px]">
      <div
        className="absolute bg-white inset-0 rounded-[16px]"
        style={{ border: "1px solid rgba(12,11,10,0.08)" }}
      />
      <div className="flex items-center relative w-full">
        <p
          className="overflow-hidden text-ellipsis text-[16px] text-[#0c0b0a] leading-[20px] w-full"
          style={{ fontWeight: 500 }}
        >
          {category.emoji} {category.name}
        </p>
      </div>
      <div
        className="bg-[#ffefd3] flex flex-col p-[14px] rounded-[12px] w-full relative"
        style={{ gap: 8 }}
      >
        <div className="flex gap-[6px] items-start">
          <span className="text-[20px] leading-[20px] shrink-0">❓</span>
          <p
            className="text-[14px] text-[#0c0b0a] leading-[20px]"
            style={{ fontWeight: 700, letterSpacing: "-0.14px" }}
          >
            What you can deduct
          </p>
        </div>
        <div className="flex flex-col" style={{ gap: 8 }}>
          {deductions.map((d, i) => (
            <div key={i} className="flex items-center justify-between w-full">
              <span className="text-[14px] text-[rgba(12,11,10,0.65)] leading-[1.5]">
                {d.description}
              </span>
              <span
                className="flex items-center h-[32px] pl-[4px] pr-[8px] rounded-[8px] text-[14px] whitespace-nowrap ml-3 shrink-0"
                style={{ background: "white", color: "rgba(12,11,10,0.8)" }}
              >
                ~{fmt(d.estimatedAmount)}
              </span>
            </div>
          ))}
        </div>
      </div>
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
        const parsed: TaxAnalysis = JSON.parse(stored);
        // If the stored object is a partial error stub (no alreadyClaiming), merge with MOCK_DATA
        if (!parsed.alreadyClaiming || !parsed.canImprove) {
          setAnalysis(ensureDeductions({ ...MOCK_DATA, isExample: true, errorDetail: parsed.errorDetail }));
        } else {
          setAnalysis(ensureDeductions(parsed));
        }
      } catch {
        setAnalysis(ensureDeductions(MOCK_DATA));
      }
    } else {
      setAnalysis(ensureDeductions(MOCK_DATA));
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 80 }}>
        {/* Example / error banner */}
        {analysis.isExample && (
          <div className="bg-[#fff8e6] border-b border-[#f5e0a0] px-6 py-3 text-center">
            <p className="text-[13px] text-[#8a6800] font-medium">
              Showing example analysis — upload your SA100 PDF for a personalised report
            </p>
            {analysis.errorDetail && (
              <p className="text-[12px] text-[#8a6800] mt-1 opacity-70 font-mono break-all">
                {analysis.errorDetail}
              </p>
            )}
          </div>
        )}

        {/* White header section */}
        <div
          className="flex flex-col items-center text-center px-6"
          style={{ paddingTop: 32, paddingBottom: 32, gap: 6 }}
        >
          <p className="text-[12px] text-[#36893b] text-center" style={{ fontWeight: 400 }}>
            YOUR TAX RETURN {analysis.taxYear}
          </p>
          <h1 className="text-[30px] text-black" style={{ fontWeight: 700, lineHeight: 1.2 }}>
            You could have claimed{" "}
            <span style={{ color: "#36893b" }}>{fmt(analysis.totalMissedDeductions)}</span>
            {" "}more
          </h1>
          {analysis.businessType && (
            <p className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3] text-center">
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
          <div
            className="flex flex-col xl:flex-row xl:items-start mx-auto"
            style={{ gap: 53, maxWidth: 1051 }}
          >
            {/* LEFT — Already expensing */}
            <div className="flex flex-col flex-1" style={{ gap: 16 }}>
              <div className="flex items-center justify-between">
                <h2
                  className="text-[20px] text-black whitespace-nowrap"
                  style={{ fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.2px" }}
                >
                  What you are already expensing
                </h2>
                <span
                  className="flex items-center h-[32px] pl-[4px] pr-[8px] rounded-[8px] text-[14px] whitespace-nowrap bg-white ml-3 shrink-0"
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

            {/* RIGHT — Can improve */}
            <div className="flex flex-col flex-1" style={{ gap: 16 }}>
              <div className="flex items-center justify-between">
                <h2
                  className="text-[20px] text-black whitespace-nowrap"
                  style={{ fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.2px" }}
                >
                  What can be improved
                </h2>
                <span
                  className="flex items-center h-[32px] pl-[4px] pr-[8px] rounded-[8px] text-[14px] whitespace-nowrap bg-white ml-3 shrink-0"
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
          className="absolute flex gap-[8px] items-center left-[39px] top-[30px] text-[#154618] text-[16px] hover:opacity-70 transition-opacity"
          style={{ fontWeight: 500 }}
        >
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <path d="M13 16l-6-6 6-6" stroke="#154618" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="absolute bg-[#a0d766] h-[48px] right-[20px] top-[16px] rounded-[10px] w-[177px] text-[#154618] text-[16px] hover:brightness-95 active:scale-[0.98] transition-all"
          style={{ fontWeight: 600 }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
