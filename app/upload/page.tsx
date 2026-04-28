"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const LOGO = "/logo.png";
const DOC_SHADOW = "https://www.figma.com/api/mcp/asset/241ae416-cf71-4622-9cce-d9df9d3ae161";
const DOC_ILLUSTRATION = "https://www.figma.com/api/mcp/asset/c139c461-5ba5-47a3-8412-fc94ab09a652";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") {
      setError("Please upload a PDF file.");
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

  async function handleAnalyse() {
    if (!file) {
      setError("Please select your tax return PDF.");
      return;
    }
    setUploading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      sessionStorage.setItem("pdfBase64", base64);
      sessionStorage.setItem("pdfName", file.name);
      router.push("/analyzing");
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="bg-white relative min-h-screen">
      {/* Logo */}
      <div className="-translate-x-1/2 absolute h-[27px] left-1/2 top-[32px] w-[96px]">
        <img alt="Taxfix" className="absolute block inset-0 max-w-none size-full" src={LOGO} />
      </div>

      {/* Content */}
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col gap-[24px] items-center left-[calc(50%+0.5px)] top-[calc(50%+19.5px)] w-[600px]">
        {/* Document illustration with shadow */}
        <div className="relative shrink-0 size-[170px]">
          <div
            className="absolute overflow-hidden pointer-events-none"
            style={{ inset: "56.6% 0 0 0", opacity: 0.04 }}
          >
            <img
              alt=""
              className="absolute max-w-none"
              style={{ height: "116.67%", left: "1.71%", top: 0, width: "100.13%" }}
              src={DOC_SHADOW}
            />
          </div>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              alt=""
              className="absolute max-w-none"
              style={{ height: "112.56%", left: "-0.04%", top: "-12.56%", width: "108.33%" }}
              src={DOC_ILLUSTRATION}
            />
          </div>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-[6px] items-center justify-center">
          <p className="font-bold leading-[1.2] text-[30px] text-black whitespace-nowrap">
            Upload your tax return
          </p>
          <p className="text-[14px] leading-[1.3] text-[rgba(12,11,10,0.6)] text-center w-[600px]">
            {"Upload any year's Self Assessment and we'll identify all the allowable deductions and what you have been missing"}
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
        <div className="flex flex-col gap-[34px] items-center">
          <div className="flex flex-col items-start">
            <button
              onClick={handleAnalyse}
              disabled={!file || uploading}
              className="bg-[#a0d766] h-[48px] rounded-[10px] w-[300px] text-[#154618] text-[16px] hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 500 }}
            >
              {uploading ? "Preparing…" : "Analyse my tax return"}
            </button>
          </div>

          {/* Trust badges — inline */}
          <div className="flex gap-[35px] items-center">
            <div className="flex gap-[8px] items-center">
              <svg viewBox="0 0 24 24" fill="none" className="shrink-0 w-6 h-6">
                <rect x="3" y="11" width="18" height="12" rx="2" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3] whitespace-nowrap">All data encrypted</span>
            </div>
            <div className="flex gap-[8px] items-center">
              <svg viewBox="0 0 24 24" fill="none" className="shrink-0 w-6 h-6">
                <path d="M12 2L4 6v6c0 5.25 3.5 10 8 11 4.5-1 8-5.75 8-11V6L12 2z" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5"/>
                <path d="M9 12l2 2 4-4" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3] whitespace-nowrap">HMRC-recognised software</span>
            </div>
            <div className="flex gap-[8px] items-center">
              <svg viewBox="0 0 24 24" fill="none" className="shrink-0 w-6 h-6">
                <circle cx="12" cy="8" r="4" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-[14px] text-[rgba(12,11,10,0.6)] leading-[1.3] whitespace-nowrap">{"We aren't storing your personal data"}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
