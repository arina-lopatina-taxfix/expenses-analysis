"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const LOGO = "https://www.figma.com/api/mcp/asset/7f10a9fe-bace-4a74-8cf3-951731041fb0";
const DOC_ILLUSTRATION = "https://www.figma.com/api/mcp/asset/011c8fc3-9ccd-4eec-b4c7-4f1baf6c2f7a";

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
    <main className="min-h-screen bg-white flex flex-col items-center">
      {/* Logo */}
      <div className="w-full flex justify-center pt-8">
        <img src={LOGO} alt="Taxfix" className="h-[27px] w-[96px] object-contain" />
      </div>

      {/* Content */}
      <div className="w-full max-w-[375px] px-4 flex flex-col items-center gap-6 mt-8 pb-12">
        {/* Document illustration */}
        <img
          src={DOC_ILLUSTRATION}
          alt="Tax return document"
          className="w-[220px] object-contain"
        />

        {/* Heading */}
        <div className="flex flex-col gap-2 text-center w-full">
          <h1 className="text-[30px] leading-[1.2] text-[#0c0b0a]" style={{ fontWeight: 700 }}>
            Upload your tax return
          </h1>
          <p className="text-[14px] leading-[1.3] text-[rgba(12,11,10,0.6)]">
            Your HMRC Self Assessment SA100 or SA302 form
          </p>
        </div>

        {/* Upload area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 cursor-pointer transition-all rounded-lg"
          style={{
            height: 161,
            background: dragging ? "#e8e4e2" : "#f2efed",
            border: `1.5px dashed ${dragging ? "#a0d766" : "rgba(12,11,10,0.12)"}`,
            padding: 24,
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
              {/* Upload icon */}
              <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                <path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6z" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2L16 6H14V2z" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-[14px] font-semibold text-[#36893b] text-center">{file.name}</p>
              <p className="text-[12px] text-[rgba(12,11,10,0.5)]">
                {(file.size / 1024 / 1024).toFixed(2)} MB · tap to change
              </p>
            </>
          ) : (
            <>
              {/* Upload icon */}
              <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                <path d="M17 13v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="13 7 10 4 7 7" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="10" y1="4" x2="10" y2="13" stroke="rgba(12,11,10,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-[14px] text-[rgba(12,11,10,0.8)] text-center">
                Drag and drop or{" "}
                <span className="text-[#154618] font-semibold">Browse</span>
              </p>
            </>
          )}
        </div>

        {error && (
          <p className="text-[13px] text-red-600 text-center">{error}</p>
        )}

        {/* Analyse button */}
        <button
          onClick={handleAnalyse}
          disabled={!file || uploading}
          className="h-12 bg-[#a0d766] text-[#154618] text-[16px] rounded-[10px] hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ width: 300, fontWeight: 600 }}
        >
          {uploading ? "Preparing…" : "Analyse my tax return"}
        </button>

        {/* Trust badges */}
        <div className="flex items-center justify-between w-full gap-3 pt-1">
          <div className="flex flex-col items-center gap-1 text-center flex-1">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <rect x="3" y="9" width="14" height="10" rx="2" stroke="rgba(12,11,10,0.6)" strokeWidth="1.5"/>
              <path d="M7 9V6a3 3 0 0 1 6 0v3" stroke="rgba(12,11,10,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-[10px] text-[rgba(12,11,10,0.55)] leading-tight">
              All data encrypted
            </span>
          </div>
          <div className="w-px h-8 bg-black/10 flex-shrink-0" />
          <div className="flex flex-col items-center gap-1 text-center flex-1">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <path d="M10 2L3 6v5c0 4 3 7.5 7 8.5C17 18.5 17 11 17 11V6L10 2z" stroke="rgba(12,11,10,0.6)" strokeWidth="1.5"/>
              <path d="M7 10l2 2 4-4" stroke="rgba(12,11,10,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[10px] text-[rgba(12,11,10,0.55)] leading-tight">
              HMRC-recognised software
            </span>
          </div>
          <div className="w-px h-8 bg-black/10 flex-shrink-0" />
          <div className="flex flex-col items-center gap-1 text-center flex-1">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <circle cx="10" cy="7" r="3" stroke="rgba(12,11,10,0.6)" strokeWidth="1.5"/>
              <path d="M3 17c0-3 3-5 7-5s7 2 7 5" stroke="rgba(12,11,10,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-[10px] text-[rgba(12,11,10,0.55)] leading-tight">
              We aren&apos;t storing your data
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
