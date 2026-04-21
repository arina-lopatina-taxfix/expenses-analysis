"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/types";

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
    <main className="min-h-screen bg-[#f9f7f5] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative crystal shapes */}
      <div
        className="absolute top-8 left-6 w-20 h-20 opacity-60 pointer-events-none"
        aria-hidden
      >
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 4 L68 24 L68 56 L40 76 L12 56 L12 24 Z" fill="#a0d766" opacity="0.5" />
          <path d="M40 14 L60 28 L60 52 L40 66 L20 52 L20 28 Z" fill="#a0d766" opacity="0.7" />
        </svg>
      </div>
      <div
        className="absolute top-20 right-8 w-12 h-12 opacity-50 pointer-events-none rotate-12"
        aria-hidden
      >
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 2 L44 14 L44 34 L24 46 L4 34 L4 14 Z" fill="#a0d766" opacity="0.6" />
        </svg>
      </div>
      <div
        className="absolute bottom-24 right-4 w-16 h-16 opacity-40 pointer-events-none -rotate-6"
        aria-hidden
      >
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z" fill="#a0d766" opacity="0.5" />
        </svg>
      </div>
      <div
        className="absolute bottom-16 left-8 w-10 h-10 opacity-45 pointer-events-none rotate-45"
        aria-hidden
      >
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" fill="#a0d766" opacity="0.6" />
        </svg>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[30px] font-bold leading-tight text-[#0c0b0a]">
            Let&apos;s get to know you!
          </h1>
          <p className="text-[15px] text-[rgba(12,11,10,0.65)] leading-snug">
            Select all that apply so we can find you eligible credits and
            deductions
          </p>
        </div>

        {/* Checkbox options */}
        <div className="flex flex-col gap-3">
          {OPTIONS.map((opt) => {
            const checked = profile[opt.key];
            return (
              <button
                key={opt.key}
                onClick={() => toggle(opt.key)}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl border-2 bg-white text-left transition-all ${
                  checked
                    ? "border-[#a0d766] shadow-sm"
                    : "border-black/10 hover:border-black/20"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                    checked
                      ? "bg-[#a0d766] border-[#a0d766]"
                      : "border-black/25 bg-white"
                  }`}
                >
                  {checked && (
                    <svg
                      viewBox="0 0 12 10"
                      fill="none"
                      className="w-3 h-3"
                      xmlns="http://www.w3.org/2000/svg"
                    >
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
                <span className="text-[16px] font-medium text-[#0c0b0a]">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className="w-full h-12 bg-[#a0d766] text-[#154618] font-semibold text-[16px] rounded-[10px] hover:brightness-95 active:scale-[0.98] transition-all mt-2"
        >
          Continue
        </button>
      </div>
    </main>
  );
}
