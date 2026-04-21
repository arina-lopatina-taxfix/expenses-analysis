"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

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

    try {
      const profileRaw = sessionStorage.getItem("userProfile") || "{}";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("profile", profileRaw);

      // Store file reference for API call after navigation
      sessionStorage.setItem("analysisStatus", "pending");

      // Convert file to base64 and store
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        sessionStorage.setItem("pdfBase64", base64);
        sessionStorage.setItem("pdfName", file.name);
        router.push("/analyzing");
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Something went wrong. Please try again.");
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f9f7f5] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Document illustration */}
        <div className="flex justify-center">
          <div className="w-36 h-36 relative">
            {/* Document stack illustration */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Back document */}
                <div className="absolute -right-2 -bottom-2 w-24 h-30 bg-[#dde8c8] rounded-lg border border-[#c5d9a0]" style={{height: "7.5rem"}} />
                {/* Middle document */}
                <div className="absolute -right-1 -bottom-1 w-24 bg-[#eaf2d8] rounded-lg border border-[#c5d9a0]" style={{height: "7.5rem"}} />
                {/* Front document */}
                <div className="relative w-24 bg-white rounded-lg border-2 border-[#a0d766] shadow-md p-2" style={{height: "7.5rem"}}>
                  <div className="flex items-center gap-1 mb-2">
                    <div className="w-3 h-3 bg-[#a0d766] rounded-sm" />
                    <div className="h-1.5 bg-[#e0e0e0] rounded flex-1" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 bg-[#f0f0f0] rounded w-full" />
                    <div className="h-1.5 bg-[#f0f0f0] rounded w-3/4" />
                    <div className="h-1.5 bg-[#f0f0f0] rounded w-full" />
                    <div className="h-1.5 bg-[#f0f0f0] rounded w-2/3" />
                    <div className="h-1.5 bg-[#a0d766]/40 rounded w-full" />
                    <div className="h-1.5 bg-[#a0d766]/40 rounded w-4/5" />
                  </div>
                  {/* Magnifying glass */}
                  <div className="absolute -right-3 -bottom-3 w-8 h-8 bg-[#a0d766] rounded-full flex items-center justify-center shadow">
                    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                      <circle cx="6" cy="6" r="4" stroke="#154618" strokeWidth="1.5" />
                      <path d="M10 10L14 14" stroke="#154618" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-[28px] font-bold text-[#0c0b0a] leading-tight">
            Upload your tax return
          </h1>
          <p className="text-[14px] text-[rgba(12,11,10,0.6)]">
            Your HMRC Self Assessment SA100 or SA302 form
          </p>
        </div>

        {/* Upload area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
            dragging
              ? "border-[#a0d766] bg-[#a0d766]/10"
              : file
              ? "border-[#a0d766] bg-[#a0d766]/5"
              : "border-black/20 bg-white hover:border-black/30"
          }`}
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
              <div className="w-12 h-12 bg-[#a0d766]/20 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#36893b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="14,2 14,8 20,8" stroke="#36893b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-[14px] font-semibold text-[#36893b]">{file.name}</p>
                <p className="text-[12px] text-[rgba(12,11,10,0.5)]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="rgba(12,11,10,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="17 8 12 3 7 8" stroke="rgba(12,11,10,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="3" x2="12" y2="15" stroke="rgba(12,11,10,0.5)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-[14px] font-medium text-[rgba(12,11,10,0.8)]">
                  Drop your PDF here or{" "}
                  <span className="text-[#36893b] font-semibold">browse</span>
                </p>
                <p className="text-[12px] text-[rgba(12,11,10,0.5)] mt-1">PDF up to 20MB</p>
              </div>
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
          className="w-full h-12 bg-[#a0d766] text-[#154618] font-semibold text-[16px] rounded-[10px] hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {uploading ? "Preparing…" : "Analyse my tax return"}
        </button>

        {/* Trust badges */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex flex-col items-center gap-1 text-center flex-1">
            <span className="text-lg">🔒</span>
            <span className="text-[10px] text-[rgba(12,11,10,0.55)] leading-tight">
              All data encrypted
            </span>
          </div>
          <div className="w-px h-8 bg-black/10" />
          <div className="flex flex-col items-center gap-1 text-center flex-1">
            <span className="text-lg">✅</span>
            <span className="text-[10px] text-[rgba(12,11,10,0.55)] leading-tight">
              HMRC-recognised software
            </span>
          </div>
          <div className="w-px h-8 bg-black/10" />
          <div className="flex flex-col items-center gap-1 text-center flex-1">
            <span className="text-lg">👤</span>
            <span className="text-[10px] text-[rgba(12,11,10,0.55)] leading-tight">
              We aren&apos;t storing your data
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
