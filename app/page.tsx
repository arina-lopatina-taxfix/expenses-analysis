"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/types";

const LOGO = "https://www.figma.com/api/mcp/asset/3ac85fcb-5a31-46d5-a656-53c9ad70a5a5";
const DECORATIVE = "https://www.figma.com/api/mcp/asset/bc7ca1c5-1462-45f1-86ed-b1989d6b44f4";

interface CheckboxOption {
  key: keyof UserProfile;
  emoji: string;
  label: string;
}

const OPTIONS: CheckboxOption[] = [
  { key: "married", emoji: "💍", label: "Married" },
  { key: "dependants", emoji: "👶🏻", label: "Dependants" },
  { key: "studentLoan", emoji: "🎓", label: "Student loan" },
  { key: "homeowner", emoji: "🔑", label: "Homeowner" },
  { key: "renter", emoji: "🏠", label: "Renter" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    married: false,
    dependants: false,
    studentLoan: false,
    homeowner: false,
    renter: false,
  });

  function toggle(key: keyof UserProfile) {
    setProfile((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleContinue() {
    sessionStorage.setItem("userProfile", JSON.stringify(profile));
    router.push("/upload");
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center relative overflow-hidden">
      {/* Logo */}
      <div className="w-full flex justify-center pt-8 pb-0 z-10 relative">
        <img src={LOGO} alt="Taxfix" className="h-[27px] w-[96px] object-contain" />
      </div>

      {/* Decorative symbols */}
      <img
        src={DECORATIVE}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Content */}
      <div className="w-full max-w-[375px] px-4 flex flex-col gap-9 relative z-10 mt-10 pb-12">
        {/* Heading */}
        <div className="flex flex-col gap-2">
          <h1
            className="text-[30px] leading-[1.2] text-[#0c0b0a]"
            style={{ fontWeight: 700 }}
          >
            Let&apos;s get to know you!
          </h1>
          <p className="text-[14px] leading-[1.3] text-[rgba(12,11,10,0.6)]">
            Select all that apply so we can find you eligible credits and
            deductions
          </p>
        </div>

        {/* Checkbox options */}
        <div className="flex flex-col gap-4">
          {OPTIONS.map((opt) => {
            const checked = profile[opt.key];
            return (
              <button
                key={opt.key}
                onClick={() => toggle(opt.key)}
                className="flex items-center gap-4 px-4 py-4 rounded-2xl bg-white text-left transition-all"
                style={{ border: "1px solid #8e8e8e" }}
              >
                {/* Custom checkbox */}
                <span
                  className="flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: checked ? "none" : "1.5px solid #8e8e8e",
                    background: checked ? "#a0d766" : "white",
                  }}
                >
                  {checked && (
                    <svg viewBox="0 0 12 10" fill="none" className="w-3 h-2.5">
                      <path
                        d="M1 5L4.5 8.5L11 1"
                        stroke="#154618"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-[16px] text-[#0c0b0a]" style={{ fontWeight: 500 }}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            className="h-12 bg-[#a0d766] text-[#154618] text-[16px] rounded-[10px] hover:brightness-95 active:scale-[0.98] transition-all"
            style={{ width: 300, fontWeight: 600 }}
          >
            Continue
          </button>
        </div>
      </div>
    </main>
  );
}
