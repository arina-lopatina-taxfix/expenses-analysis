"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/types";

const LOGO = "/logo.png";
const DECORATIVE = "https://www.figma.com/api/mcp/asset/faafab47-24cc-425c-9c92-6f3839e34bc7";

const OPTIONS: { key: keyof UserProfile; label: string }[] = [
  { key: "married", label: "💍 Married" },
  { key: "dependants", label: "👶🏻 Dependants" },
  { key: "studentLoan", label: "🎓 Student loan" },
  { key: "homeowner", label: "🔑 Homeowner" },
  { key: "renter", label: "🏠 Renter" },
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
    <main className="bg-white relative min-h-screen overflow-hidden">
      {/* Logo */}
      <div className="-translate-x-1/2 absolute h-[27px] left-1/2 top-[32px] w-[96px]">
        <img alt="Taxfix" className="h-[27px] w-[96px] object-contain" src={LOGO} />
      </div>

      {/* Decorative — right */}
      <div className="absolute h-[233px] left-[1152px] overflow-clip top-[143px] w-[243px]">
        <div className="-translate-x-1/2 absolute left-[calc(50%+21.63px)] size-[555px] top-[-177px]">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={DECORATIVE} />
        </div>
      </div>

      {/* Decorative — left */}
      <div className="absolute h-[236px] left-[-15px] overflow-clip top-[310px] w-[215px]">
        <div className="-translate-x-1/2 absolute left-[calc(50%+328.5px)] size-[872px] top-[-118px]">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={DECORATIVE} />
        </div>
      </div>

      {/* Content */}
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col gap-[36px] items-center left-1/2 top-[calc(50%+30px)] w-[560px]">
        {/* Heading */}
        <div className="flex flex-col gap-[6px] items-center justify-center">
          <p className="font-bold leading-[1.2] text-[30px] text-black whitespace-nowrap">
            {"Let's get to know you!"}
          </p>
          <p className="text-[14px] leading-[1.3] text-[rgba(12,11,10,0.6)] text-center">
            Select all that apply so we can find you eligible credits and deductions
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-[12px] items-end justify-center">
          {OPTIONS.map((opt) => {
            const checked = profile[opt.key];
            return (
              <button
                key={opt.key}
                onClick={() => toggle(opt.key)}
                className="flex gap-[16px] items-center px-[24px] py-[16px] relative w-[495px] text-left"
              >
                <div className="absolute bg-white border border-[#8e8e8e] inset-0 rounded-[16px]" />
                <span
                  className="flex items-center justify-center shrink-0 relative z-10"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: checked ? "none" : "1.5px solid #96928e",
                    background: checked ? "#a0d766" : "white",
                  }}
                >
                  {checked && (
                    <svg viewBox="0 0 12 10" fill="none" className="w-3 h-2.5">
                      <path d="M1 5L4.5 8.5L11 1" stroke="#154618" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-[16px] text-[#0c0b0a] leading-[20px] relative z-10" style={{ fontWeight: 500 }}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Button */}
        <div className="flex flex-col items-start">
          <button
            onClick={handleContinue}
            className="bg-[#a0d766] h-[48px] rounded-[10px] w-[300px] text-[#154618] text-[16px] hover:brightness-95 active:scale-[0.98] transition-all"
            style={{ fontWeight: 500 }}
          >
            Continue
          </button>
        </div>
      </div>
    </main>
  );
}
