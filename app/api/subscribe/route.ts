import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let body: { firstName?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    // No API key configured — accept silently so dev/preview still works
    return NextResponse.json({ ok: true });
  }

  const listId = process.env.BREVO_LIST_ID ? Number(process.env.BREVO_LIST_ID) : undefined;

  const payload: Record<string, unknown> = {
    email,
    attributes: { FIRSTNAME: firstName },
    updateEnabled: true,
  };
  if (listId) payload.listIds = [listId];

  try {
    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    // 204 = already exists (updateEnabled handles it), 201 = created
    if (!res.ok && res.status !== 204) {
      console.error("Brevo API error:", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
    }
  } catch (err) {
    console.error("Brevo fetch error:", err);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
