"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

const TAXFIX_URL = "https://taxfix.com/en-uk/assessment/signup";
const ILLUSTRATION = "/list-tasks.png";

export default function FixFilePage() {
  useEffect(() => { track("page_viewed", { page: "fix-file" }); }, []);

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
            File your next tax return with us to get help from an accredited tax accountant and make sure you claim everything you&apos;re entitled to.
          </p>
        </div>

        <div className="flex flex-col items-center w-full max-w-[300px]">
          <a
            href={TAXFIX_URL}
            onClick={(e) => { e.preventDefault(); window.open(TAXFIX_URL, "_blank"); }}
            className="flex items-center justify-center h-[48px] w-full rounded-[10px] text-[16px] text-[#154618]"
            style={{ background: "#a0d766", fontWeight: 500 }}
          >
            File my tax return
          </a>
        </div>
      </div>
    </main>
  );
}
