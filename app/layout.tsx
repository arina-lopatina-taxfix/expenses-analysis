import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tax Return Analyser",
  description: "Analyse your UK Self Assessment tax return to find missed deductions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f9f7f5]">
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
