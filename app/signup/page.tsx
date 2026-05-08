"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { usePageFlag } from "@/lib/usePageFlag";

export default function SignUpPage() {
  const router = useRouter();
  const pageEnabled = usePageFlag("signup-page");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { track("page_viewed", { page: "signup" }); }, []);

  if (!pageEnabled) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    sessionStorage.setItem("userSignup", JSON.stringify({ firstName, email }));

    // Fire to server-side route in background; navigate immediately
    fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, email }),
    }).catch(() => {});

    router.push("/results");
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#f9f7f5" }}>
      <div className="flex flex-1 items-center justify-center px-4 py-[50px]">
        <div className="bg-white rounded-[11px] p-8 w-full" style={{ maxWidth: 540 }}>
          <div className="flex flex-col gap-[20px]">
            {/* Heading */}
            <div className="text-center flex flex-col gap-[8px]">
              <p className="text-[27px] text-black leading-[1.2]" style={{ fontWeight: 700 }}>
                Your tax summary is almost ready
              </p>
              <p className="text-[16px] text-[#6B6968] leading-[1.4]">
                Enter your details to see where you could claim back expenses and avoid leaving money on the table
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
              <div className="flex flex-col gap-[6px]">
                <label className="text-[16px] text-[#3c4858]" style={{ fontWeight: 700 }} htmlFor="firstName">
                  First name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  maxLength={200}
                  autoComplete="given-name"
                  className="w-full h-[50px] px-4 text-[16px] outline-none focus:border-[#a0d766]"
                  style={{ border: "1px solid #96928E", borderRadius: 15 }}
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label className="text-[16px] text-[#3c4858]" style={{ fontWeight: 700 }} htmlFor="email">
                  Email <span aria-hidden="true">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full h-[50px] px-4 text-[16px] outline-none focus:border-[#a0d766]"
                  style={{ border: "1px solid #96928E", borderRadius: 15 }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="h-[50px] w-full text-[16px] text-[#154618] bg-[#a0d766] hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-50"
                style={{ fontWeight: 700, borderRadius: 15 }}
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
