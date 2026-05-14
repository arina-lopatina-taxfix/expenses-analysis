"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";

const ILLUSTRATION = "/mailbox.png";

export default function NotATaxReturnPage() {
  const router = useRouter();

  useEffect(() => { track("page_viewed", { page: "not-a-return" }); }, []);

  return (
    <main className="bg-white min-h-screen flex flex-col items-center justify-center px-4" style={{ marginTop: -40 }}>
      <div className="flex flex-col gap-[24px] items-center w-full max-w-[560px]">
        <div className="relative shrink-0" style={{ width: 250, height: 250 }}>
          <img alt="" className="absolute inset-0 object-cover size-full pointer-events-none" src={ILLUSTRATION} />
        </div>

        <div className="flex flex-col gap-[6px] items-center text-center">
          <p className="text-[30px] text-black leading-[1.2]" style={{ fontWeight: 700 }}>
            We can&apos;t analyse this document
          </p>
          <p className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3] text-center" style={{ maxWidth: 514 }}>
            We can&apos;t analyse this file because it isn&apos;t a tax return. Please upload your tax return so we can check it and help you save on your taxes.
          </p>
        </div>

        <div className="flex flex-col items-center w-full max-w-[300px]">
          <button
            onClick={() => router.push("/upload")}
            className="flex items-center justify-center h-[48px] w-full rounded-[10px] text-[16px] text-[#154618]"
            style={{ background: "#a0d766", fontWeight: 500 }}
          >
            Upload my tax return
          </button>
        </div>
      </div>
    </main>
  );
}
