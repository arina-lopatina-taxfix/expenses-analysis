"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { usePageFlag } from "@/lib/usePageFlag";
import { pdfStore } from "@/lib/pdfStore";

const DOC_ILLUSTRATION = "/Document.png";

const MAX_MB = 4;

export default function UploadPage() {
  const router = useRouter();
  const pageEnabled = usePageFlag("upload-page");

  useEffect(() => { track("page_viewed", { page: "upload" }); }, []);

  if (!pageEnabled) return null;

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File is too large. Please upload a PDF under ${MAX_MB} MB.`);
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  function handleAnalyse() {
    if (!file) {
      setError("Please select your tax return PDF.");
      return;
    }
    pdfStore.setFile(file);
    router.push("/analyzing");
  }

  return (
    <main className="bg-white min-h-screen flex flex-col" style={{ marginTop: -80 }}>
      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="flex flex-col gap-[24px] items-center w-full max-w-[600px]">
          {/* Document illustration with shadow */}
          <img alt="" src={DOC_ILLUSTRATION} className="shrink-0 object-contain" style={{ width: 170, height: 170 }} />

          {/* Heading */}
          <div className="flex flex-col gap-[6px] items-center justify-center">
            <p className="font-bold leading-[1.2] text-[30px] text-black text-center">
              Upload your tax return
            </p>
            <p className="text-[14px] leading-[1.3] text-[rgba(12,11,10,0.6)] text-center w-full">
              {"Upload any self assessment and we'll find any possible allowable deductions you might have missed."}
            </p>
          </div>

          {/* Upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col gap-[8px] h-[161px] items-center justify-center p-[24px] relative rounded-[8px] shrink-0 w-full cursor-pointer"
            style={{
              background: dragging ? "#e8e4e2" : "#f2efed",
              border: `1px dashed ${dragging ? "#a0d766" : "rgba(12,11,10,0.12)"}`,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {file ? (
              <>
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6z" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2L16 6H14V2z" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-[16px] text-[#36893b] text-center" style={{ fontWeight: 500 }}>{file.name}</p>
                <p className="text-[12px] text-[rgba(12,11,10,0.5)]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · tap to change
                </p>
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                  <path d="M4 14.5v1A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5v-1M10 3v9M7 6l3-3 3 3" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-[16px] text-[rgba(12,11,10,0.8)] text-center" style={{ fontWeight: 500 }}>
                  Upload or drag and drop file
                </p>
              </>
            )}
          </div>

          {error && <p className="text-[13px] text-red-600 text-center">{error}</p>}

          {/* Button + badges */}
          <div className="flex flex-col gap-[34px] items-center w-full">
            <button
              onClick={handleAnalyse}
              disabled={!file}
              className="bg-[#a0d766] h-[48px] rounded-[10px] w-full text-[#154618] text-[16px] hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 500 }}
            >
              Analyse my tax return
            </button>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-[24px] gap-y-[12px] items-center justify-center">
              <div className="flex gap-[8px] items-center">
                <svg viewBox="0 0 24 24" fill="none" className="shrink-0 w-6 h-6">
                  <rect x="3" y="11" width="18" height="12" rx="2" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3]">All data encrypted</span>
              </div>
              <div className="flex gap-[8px] items-center">
                <svg viewBox="0 0 24 24" fill="none" className="shrink-0 w-6 h-6">
                  <path d="M12 2L4 6v6c0 5.25 3.5 10 8 11 4.5-1 8-5.75 8-11V6L12 2z" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5"/>
                  <path d="M9 12l2 2 4-4" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3]">HMRC-recognised software</span>
              </div>
              <div className="flex gap-[8px] items-center">
                <svg viewBox="0 0 24 24" fill="none" className="shrink-0 w-6 h-6">
                  <circle cx="12" cy="8" r="4" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3]">{"We aren't storing your personal data"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
