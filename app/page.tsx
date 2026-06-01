"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";

const ILLUSTRATION = "/list-tasks.png";
const TEST_URL = "https://taxfix.com/en-uk/expenses-test/";

export default function FunnelPage() {
  const router = useRouter();

  useEffect(() => { track("page_viewed", { page: "funnel" }); }, []);

  return (
    <main className="bg-white min-h-screen flex flex-col px-4" style={{ marginTop: -40 }}>
      {/* Callout */}
      <div className="flex justify-center pt-8">
        <div className="flex items-center gap-[16px] px-[16px] py-[10px] bg-[#f9f7f5] rounded-[11px]">
          <svg width="20" height="20" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" fill="rgba(12,11,10,0.8)"/>
          </svg>
          <p className="text-[16px] text-[rgba(12,11,10,0.8)] leading-[1.3]" style={{ fontWeight: 400 }}>
            7/10 people miss out on expenses they&apos;re legally entitled to claim
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-[24px]">
        <div className="relative shrink-0" style={{ width: 250, height: 250 }}>
          <img alt="" className="absolute inset-0 object-cover size-full pointer-events-none" src={ILLUSTRATION} />
        </div>

        <div className="flex flex-col gap-[6px] items-center text-center" style={{ maxWidth: 560 }}>
          <p className="text-[30px] text-black leading-[1.2]" style={{ fontWeight: 700 }}>
            Are you leaving money on the table?
          </p>
          <p className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3] text-center" style={{ maxWidth: 514 }}>
            Answer a few quick questions and our smart tax engine will help find your unclaimed expenses. Or, if you want it to be really accurate, you can upload your previous year&apos;s tax return and we can spot every deduction you might be missing.
          </p>
        </div>

        <div className="flex flex-col gap-[8px] items-center w-full max-w-[300px]">
          <a
            href={TEST_URL}
            className="flex items-center justify-center h-[48px] w-full rounded-[10px] text-[16px] text-[#154618]"
            style={{ background: "#a0d766", fontWeight: 500 }}
          >
            Find out what I can claim
          </a>
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center justify-center h-[48px] w-full text-[16px] text-[#154618] hover:opacity-70 transition-opacity"
            style={{ fontWeight: 500 }}
          >
            Analyse my tax return
          </button>
        </div>
      </div>
    </main>
  );
}
