"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LOGO = "https://www.figma.com/api/mcp/asset/0f54586b-884a-43e7-ba5a-46cee4829c8b";

type IncomeType = "self-employed" | "landlord";

function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative w-full">
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=""
        className="w-full rounded-[8px] bg-white px-[14px] pt-[22px] pb-[8px] text-[16px] text-[#0c0b0a] outline-none transition-colors"
        style={{
          border: focused ? "2px solid #4C4991" : "1px solid rgba(12,11,10,0.2)",
        }}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-[14px] transition-all duration-150"
        style={{
          top: lifted ? 6 : 16,
          fontSize: lifted ? 11 : 16,
          color: lifted ? "#4C4991" : "rgba(12,11,10,0.45)",
          fontWeight: 400,
          lineHeight: 1.4,
        }}
      >
        {label}{required && " *"}
      </label>
    </div>
  );
}

function IncomeToggle({
  value,
  onChange,
}: {
  value: IncomeType;
  onChange: (v: IncomeType) => void;
}) {
  return (
    <div className="flex flex-col gap-[8px] w-full">
      <p className="text-[12px]" style={{ color: "rgba(12,11,10,0.45)", fontWeight: 400 }}>
        I am *
      </p>
      <div
        className="flex w-full rounded-[8px] p-[3px]"
        style={{ background: "rgba(12,11,10,0.06)" }}
      >
        {(["self-employed", "landlord"] as IncomeType[]).map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className="flex-1 h-[36px] rounded-[6px] text-[14px] transition-all"
              style={{
                background: active ? "white" : "transparent",
                color: active ? "#0c0b0a" : "rgba(12,11,10,0.5)",
                fontWeight: active ? 600 : 400,
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {opt === "self-employed" ? "Self-employed" : "Landlord"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [incomeType, setIncomeType] = useState<IncomeType>("self-employed");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // Pull enrichment data from the completed analysis if available
    let businessType: string | undefined;
    let totalMissedDeductions: number | undefined;
    try {
      const stored = sessionStorage.getItem("taxAnalysis");
      if (stored) {
        const analysis = JSON.parse(stored);
        businessType = analysis.businessType;
        totalMissedDeductions = analysis.totalMissedDeductions;
      }
    } catch {}

    // Fire-and-forget — don't block navigation on Zapier
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        email,
        incomeType,
        businessType,
        totalMissedDeductions,
        submittedAt: new Date().toISOString(),
      }),
    }).catch(() => {});

    sessionStorage.setItem("userSignup", JSON.stringify({ firstName, email, incomeType }));
    router.push("/results");
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#f9f7f5" }}>
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

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center px-4 py-[50px]">
        <div className="flex flex-col gap-[30px] items-center w-full max-w-[960px]">
          {/* Heading */}
          <div className="flex flex-col gap-[6px] items-center text-center">
            <h1 className="text-[30px] text-black" style={{ fontWeight: 700, lineHeight: 1.2 }}>
              Your tax summary is almost ready
            </h1>
            <p
              className="text-[14px] text-center"
              style={{ color: "rgba(12,11,10,0.6)", lineHeight: 1.3, maxWidth: 394 }}
            >
              Enter your details to see where you could claim back tax and avoid leaving money on the table.
            </p>
          </div>

          {/* Card */}
          <div
            className="bg-white w-full"
            style={{
              maxWidth: 500,
              borderRadius: 24,
              border: "2px solid #fdf8f2",
              padding: "30px 36px",
            }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-[12px]">
              <FloatingInput
                id="firstName"
                label="First name"
                value={firstName}
                onChange={setFirstName}
                required
              />
              <FloatingInput
                id="email"
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-[48px] rounded-[10px] text-[#154618] text-[16px] hover:brightness-95 active:scale-[0.98] transition-all mt-[4px] disabled:opacity-60"
                style={{ background: "#a0d766", fontWeight: 600 }}
              >
                Get my tax summary
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
