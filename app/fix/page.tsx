"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

const TAXFIX_URL = "https://taxfix.com/en-uk/assessment/signup";
const ILLUSTRATION = "/list-tasks.png";

export default function FixPage() {
  useEffect(() => { track("page_viewed", { page: "fix" }); }, []);

  return (
    <main className="bg-white min-h-screen flex flex-col items-center justify-center px-4" style={{ marginTop: -40 }}>
      <div className="flex flex-col gap-[24px] items-center w-full max-w-[560px]">
        <div className="relative shrink-0" style={{ width: 250, height: 250 }}>
          <img alt="" className="absolute inset-0 object-cover size-full pointer-events-none" src={ILLUSTRATION} />
        </div>

        <div className="flex flex-col gap-[6px] items-center text-center">
          <p className="text-[30px] text-black leading-[1.2]" style={{ fontWeight: 700 }}>
            Don&apos;t leave money on the table
          </p>
          <p className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3] text-center" style={{ maxWidth: 514 }}>
            If you filed your tax return within the last 12 months, you may still be able to amend it and get more money back. Chat with our team to figure out the next steps, or file your next return with us to help make sure you claim everything you&apos;re entitled to.
          </p>
        </div>

        <div className="flex flex-col gap-[8px] items-center w-full max-w-[300px]">
          <a
            href="https://calendly.com/nik-sheth-taxfix/30min"
            onClick={(e) => { e.preventDefault(); window.open("https://calendly.com/nik-sheth-taxfix/30min", "_blank"); }}
            className="flex items-center justify-center h-[48px] w-full rounded-[10px] text-[16px] text-[#154618]"
            style={{ background: "#a0d766", fontWeight: 500 }}
          >
            Get help with amendment
          </a>
          <a
            href={TAXFIX_URL}
            onClick={(e) => { e.preventDefault(); window.open(TAXFIX_URL, "_blank"); }}
            className="flex items-center justify-center h-[48px] w-full text-[16px] text-[#154618] hover:opacity-70 transition-opacity"
            style={{ fontWeight: 500 }}
          >
            File my tax return
          </a>
        </div>
      </div>
    </main>
  );
}
