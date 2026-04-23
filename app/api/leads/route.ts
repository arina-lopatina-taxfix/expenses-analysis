import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("ZAPIER_WEBHOOK_URL not set — skipping lead submission");
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await request.json();
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("Zapier webhook failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Zapier webhook error:", err);
  }

  return NextResponse.json({ ok: true });
}
