"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { usePageFlag } from "@/lib/usePageFlag";
import type { TaxAnalysis, ExpenseCategory } from "@/lib/types";

const MOCK_DATA: TaxAnalysis = {
  taxYear: "2024/25",
  incomeType: "Self-employed",
  isEligible: true,
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
      {/* RIGHT: green tick + claimed description */}
      {category.claimedDescription && (
        <div className="flex flex-[1_0_0] items-start gap-[10px] min-w-0">
          <div
            className="shrink-0 flex items-center justify-center rounded-full"
            style={{ width: 22, height: 22, background: "#e8f5d6", marginTop: 1 }}
          >
            <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
              <path d="M2 6l3 3 5-5" stroke="#36893b" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[14px] text-[rgba(12,11,10,0.65)] leading-[1.5]">
            {category.claimedDescription}
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
              What do others typically deduct?
            </p>
          </div>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {category.deductions.map((d, i) => (
              <div key={i} className="flex items-center gap-[12px] w-full">
                <span className="text-[14px] text-[rgba(12,11,10,0.65)] leading-[1.5] flex-1">
                  {d.description}
                </span>
                {Number(d.estimatedAmount) > 0 && (
                  <AmountChip text={`~${fmt(d.estimatedAmount)}`} />
                )}
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
  const pageEnabled = usePageFlag("results-page");
  const [analysis, setAnalysis] = useState<TaxAnalysis | null>(null);
  const [userProfile, setUserProfile] = useState<Record<string, boolean>>({});

  useEffect(() => { track("page_viewed", { page: "results" }); }, []);

  if (!pageEnabled) return null;

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
    try {
      const profile = sessionStorage.getItem("userProfile");
      if (profile) setUserProfile(JSON.parse(profile));
    } catch { /* ignore */ }
  }, []);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#a0d766] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEligible = analysis.isEligible !== false;

  if (!isEligible) {
    const reliefs: string[] = ["pension tax relief"];
    if (userProfile.married) reliefs.push("the Marriage Allowance");
    if (userProfile.studentLoan) reliefs.push("student loan relief");
    const reliefList =
      reliefs.length === 1
        ? reliefs[0]
        : reliefs.slice(0, -1).join(", ") + " or " + reliefs[reliefs.length - 1];

    return (
      <main className="min-h-screen bg-white flex flex-col" style={{ marginTop: -40 }}>
        {/* Centered content */}
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="flex flex-col gap-[24px] items-center w-[560px] max-w-full">
            {/* Illustration */}
            <img
              src="/large.png"
              alt=""
              className="shrink-0 object-contain"
              style={{ width: 250, height: 250 }}
            />

            {/* Text */}
            <div className="flex flex-col gap-[6px] items-center text-center">
              <p className="text-[30px] text-black" style={{ fontWeight: 700, lineHeight: 1.2 }}>
                Don&apos;t miss out on tax reliefs you could claim
              </p>
              <div className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3] text-center" style={{ maxWidth: 514 }}>
                <p className="mb-[6px]">
                  If your income is from {analysis.incomeType}, expenses can&apos;t be deducted from it in your tax return. But that doesn&apos;t mean you can&apos;t save money.
                </p>
                <p>
                  But you still will be able to claim tax reliefs such as {reliefList}. File your next tax return with us and make sure you claim everything you&apos;re entitled to.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-[8px] items-center w-full max-w-[300px]">
              <a
                href="https://taxfix.com/en-uk/assessment/signup"
                className="flex items-center justify-center h-[48px] w-full rounded-[10px] text-[16px] text-[#154618]"
                style={{ background: "#a0d766", fontWeight: 500 }}
              >
                Get help with my tax return
              </a>
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center gap-[8px] h-[48px] w-full rounded-[10px] text-[16px] text-[#154618]"
                style={{ fontWeight: 500 }}
              >
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                  <path d="M13 16l-6-6 6-6" stroke="#154618" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Start again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
    {/* ── Print-only checklist ─────────────────────────────────────── */}
    <div className="print-only" style={{ fontFamily: "'ABC ROM', sans-serif", color: "#0c0b0a" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2, marginBottom: 6 }}>
          Here's your expenses checklist
        </p>
        <p style={{ fontSize: 10, color: "rgba(12,11,10,0.6)", lineHeight: 1.3 }}>
          We've reviewed your Self Assessment tax return and identified expense categories that may apply to you. Use this checklist to see which expenses you've paid for and may be able to claim.
        </p>
      </div>

      {/* Category cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {analysis.canImprove.map((cat, i) => (
          <div
            key={i}
            style={{
              border: "0.5px solid rgba(12,11,10,0.1)",
              borderRadius: 4,
              padding: 11,
              display: "flex",
              flexDirection: "column",
              gap: 11,
            }}
          >
            {/* Category header row */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{
                width: 14, height: 14, border: "1.5px solid #96928e",
                borderRadius: 4, flexShrink: 0, marginTop: 1,
              }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 500, lineHeight: 1, margin: 0 }}>
                  {cat.emoji} {cat.name}
                </p>
                {cat.description && (
                  <p style={{ fontSize: 10, color: "rgba(12,11,10,0.6)", lineHeight: 1.3, margin: 0 }}>
                    {cat.description}
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(12,11,10,0.1)" }} />

            {/* Deduction rows */}
            {(cat.deductions ?? []).map((d, j) => (
              <div key={j} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{
                  width: 14, height: 14, border: "1.5px solid #96928e",
                  borderRadius: 4, flexShrink: 0,
                }} />
                <p style={{ fontSize: 10, color: "rgba(12,11,10,0.6)", lineHeight: 1.3, margin: 0 }}>
                  {d.description}
                </p>
              </div>
            ))}

            {/* Divider */}
            {cat.adviceText && <div style={{ height: 1, background: "rgba(12,11,10,0.1)" }} />}

            {/* Advice */}
            {cat.adviceText && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontSize: 11, fontWeight: 500, lineHeight: 1, margin: 0 }}>
                  💡 Advice
                </p>
                <p style={{ fontSize: 10, color: "rgba(12,11,10,0.6)", lineHeight: 1.3, margin: 0 }}>
                  {cat.adviceText}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* ── Screen view ──────────────────────────────────────────────── */}
    <div className="screen-only min-h-screen bg-white flex flex-col" style={{ marginTop: -40 }}>
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
      <div className="flex-1" style={{ paddingBottom: 48 }}>
        {/* Back nav */}
        <div className="px-4 pt-5">
          <button
            onClick={() => router.push("/upload")}
            className="flex gap-[8px] items-center text-[rgba(12,11,10,0.8)] text-[16px] hover:opacity-70 transition-opacity"
            style={{ fontWeight: 500 }}
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <path d="M13 16l-6-6 6-6" stroke="rgba(12,11,10,0.8)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        </div>
        {/* White header section */}
        <div
          className="flex flex-col items-center text-center px-6"
          style={{ paddingTop: 24, paddingBottom: 36, gap: 16 }}
        >
          <p
            className="text-[12px] text-center w-full tracking-wide"
            style={{ fontWeight: 400, lineHeight: 1.3, color: "#96928e" }}
          >
            TAX RETURN {analysis.taxYear}
          </p>
          <h1 className="text-[32px] text-black text-center" style={{ fontWeight: 700, lineHeight: 1.2 }}>
            People in your position have claimed up to{" "}
            <span style={{ color: "#36893b" }}>{fmt(analysis.totalMissedDeductions)}</span>
            {" "}more
          </h1>
          <p
            className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3] text-center"
            style={{ maxWidth: 600 }}
          >
            Our tax engine analysed your tax return, based on your income bracket and the same type of income
          </p>
          <button
            onClick={() => router.push(analysis.taxYear === "2024/25" ? "/fix" : "/fix-file")}
            className="bg-[#a0d766] h-[48px] rounded-[10px] px-[28px] flex items-center gap-[8px] text-[#154618] text-[16px] hover:brightness-95 active:scale-[0.98] transition-all"
            style={{ fontWeight: 600 }}
          >
            Help me fix it
          </button>
        </div>

        {/* Beige content section */}
        <div
          className="px-4 xl:px-16"
          style={{
            background: "#f9f7f5",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingTop: 37,
            paddingBottom: 48,
          }}
        >
          <div
            className="flex flex-col mx-auto"
            style={{ gap: 48, maxWidth: 900 }}
          >
            {/* User summary card */}
            {(() => {
              const signup = (() => { try { const s = sessionStorage.getItem("userSignup"); return s ? JSON.parse(s) : {}; } catch { return {}; } })();
              const pills = [
                analysis.businessType,
                analysis.turnover ? `£${Number(analysis.turnover).toLocaleString("en-GB")}` : null,
                userProfile.married ? "Married" : null,
                userProfile.dependants ? "Dependants" : null,
                userProfile.studentLoan ? "Student loan" : null,
                userProfile.homeowner ? "Homeowner" : null,
                userProfile.renter ? "Renter" : null,
              ].filter(Boolean) as string[];
              return (
                <div
                  className="flex items-center gap-[16px] p-[16px] bg-white w-full screen-only"
                  style={{ border: "1px solid rgba(12,11,10,0.08)", borderRadius: 16 }}
                >
                  <div className="flex flex-[1_0_0] flex-col gap-[7px] items-start min-w-0">
                    {signup.firstName && (
                      <p className="text-[18px] text-[#0c0b0a] leading-[20px] overflow-hidden text-ellipsis w-full" style={{ fontWeight: 500 }}>
                        {signup.firstName}
                      </p>
                    )}
                    <p className="text-[12px] text-[#96928e] leading-[1.3] whitespace-nowrap">
                      {analysis.incomeType?.toUpperCase()}
                    </p>
                  </div>
                  {pills.length > 0 && (
                    <div className="flex flex-wrap gap-[8px] items-center">
                      {pills.map((pill) => (
                        <span
                          key={pill}
                          className="inline-flex items-center h-[32px] px-[12px] rounded-[8px] text-[14px] text-[rgba(12,11,10,0.8)] whitespace-nowrap"
                          style={{ background: "#f4f1f1", fontWeight: 400 }}
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

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
                <button
                  type="button"
                  onClick={() => setTimeout(() => window.print(), 0)}
                  className="flex gap-[8px] items-center cursor-pointer hover:opacity-70 transition-opacity shrink-0"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                    <path d="M10 3v9M6.5 8.5 10 12l3.5-3.5" stroke="#154618" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 15h14" stroke="#154618" strokeWidth="1.75" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[16px] text-[#154618] whitespace-nowrap" style={{ fontWeight: 500 }}>
                    Download summary
                  </span>
                </button>
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
    </div>
    </>
  );
}
