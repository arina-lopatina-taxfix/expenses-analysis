import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, createPartFromBase64, createPartFromText } from "@google/genai";
import type { TaxAnalysis, ExpenseCategory, UserProfile } from "@/lib/types";

export const maxDuration = 120;

// ─── Prompt 1: read the PDF, extract already-claimed expenses ──────────────

const PROMPT_1 = `You are a UK tax expert. Read the uploaded SA100 Self Assessment PDF and extract the data.

Read every page carefully — SA100, SA103S, SA103F, SA105.

SA103S boxes:
- Box 17: Total allowable expenses
- Box 18: Cost of goods/materials
- Box 19: Car, van and travel
- Box 20: Other allowable expenses (phone, office, advertising, etc.)

SA103F boxes:
- Box 17: Goods bought for resale
- Box 19: Wages and staff costs
- Box 20: Car, van and travel
- Box 21: Rent, rates, power, insurance
- Box 22: Repairs and renewals
- Box 23: Phone, stationery, office costs
- Box 24: Advertising and entertainment
- Box 25: Interest on loans
- Box 26: Bank and financial charges
- Box 28: Accountancy and professional fees
- Box 30: Other business expenses

SA105 boxes:
- Boxes 5–10: Letting agent fees, legal fees, insurance, maintenance, other costs

For each box with a NON-ZERO value create one alreadyClaiming entry:
- emoji: relevant emoji
- name: 2-4 words
- claimedAmount: exact GBP number from the box
- claimedDescription: what this box covers, max 80 chars
- adviceText: one tip to maximise this deduction, max 100 chars

If no expense boxes are filled, or no PDF provided, generate 2-3 realistic examples for a freelance consultant.

businessType: copy verbatim from the business description field on SA103S/SA103F. If not present, infer from the expense pattern (e.g. "sole trader plumber" from tool and van costs). Be precise — "iOS mobile developer" not "consultant", "private music tutor" not "self-employed".

Return ONLY valid JSON, no markdown, no code fences:
{
  "taxYear": "2024/25",
  "incomeType": "Self-employed",
  "businessType": "Freelance iOS developer",
  "turnover": 45000,
  "alreadyClaiming": [
    {
      "emoji": "🚗",
      "name": "Travel expenses",
      "claimedAmount": 1240,
      "claimedDescription": "Business mileage at 45p/mile (SA103S box 19).",
      "adviceText": "Actual costs may exceed flat rate for high-mileage use."
    }
  ]
}`;

// ─── Prompt 2: generate profession-specific canImprove suggestions ──────────

const HMRC_RATES = `
HMRC ALLOWABLE EXPENSES (UK Self Assessment):
- Mileage: 45p/mile (first 10k), 25p/mile after
- Home office flat rate: £6/week (£312/yr). Actual cost method often higher for homeowners.
- Mortgage interest: 20% basic-rate tax credit for landlords (not deducted from income)
- Property allowance: first £1,000 rental income tax-free
- Marriage Allowance: £1,260 transferable if one spouse earns under Personal Allowance (£12,570)
- Allowable: office costs, equipment, software, business travel, protective clothing, staff costs,
  marketing, professional fees, bank charges, skills training (maintain current skills only)
- Property: letting agent fees, insurance, maintenance (not improvements), legal fees
`;

const PROMPT_2 = `You are a UK tax expert specialising in HMRC expense optimisation. Based on the person's exact profession and what they already claim, identify missed deductions they could legitimately add to their next Self Assessment return.

${HMRC_RATES}

Generate 4-6 canImprove categories. Each must have 2-4 deduction line items.

CRITICAL: deduction descriptions must be SPECIFIC to this person's exact profession — name real tools, platforms, registration bodies, courses, and services they would actually use. Do NOT use generic labels like "software subscriptions" or "professional fees".

SPECIFICITY REFERENCE (match this level of detail for the given profession):
- iOS/Android developer → "Apple Developer Program (£79/yr)", "JetBrains IDE licence (£180/yr)", "AWS/Firebase dev account", "TestFlight distribution tools"
- Plumber/gas engineer → "Gas Safe Register annual fee", "18th Edition update course", "CHAS/Safe Contractor accreditation", "Flux, solder and consumable materials"
- Residential landlord → "Gas safety certificate per property (£75–£120 each)", "EPC renewal (£60–£120)", "Legionella risk assessment", "Smoke & CO alarm compliance"
- Therapist/counsellor → "BACP annual membership (£118)", "Clinical supervision sessions", "GDPR-compliant practice management software", "Professional indemnity insurance"
- Graphic/UX designer → "Adobe Creative Cloud (£600/yr)", "Figma Professional (£144/yr)", "Dribbble Pro portfolio", "Stock imagery licences"
- GP/private doctor → "GMC annual retention fee (£446)", "Medical indemnity (MDU/MPS)", "CPD accredited courses", "BMA membership"
- Builder/carpenter → "CSCS card renewal", "Public liability insurance", "Specialist jigs and tooling", "Sample materials for client work"
- E-commerce seller → "Platform fees (Amazon/eBay/Etsy — % of revenue)", "Branded packaging materials", "Inventory storage", "Shopify/WooCommerce subscription"
- Freelance writer/journalist → "Press card (NUJ membership)", "Specialist research databases", "Transcription software", "Home office dedicated space"
- Accountant/bookkeeper → "ICAEW/ACCA annual subscription", "Practice management software", "CPD training courses", "Professional indemnity insurance"

User profile rules:
- homeowner → add "Home Office (actual costs)" with: proportion of mortgage interest, council tax, heating, electricity
- renter → add "Home Office (rent proportion)" with: % of rent, broadband, heating for workspace
- married → add a Marriage Allowance category if one spouse may earn under £12,570
- student loan → do NOT include student loan repayments

Do NOT suggest categories the person is already claiming (listed in alreadyClaimedCategories).

Return ONLY valid JSON, no markdown, no code fences:
{
  "canImprove": [
    {
      "emoji": "💻",
      "name": "Dev tools & licences",
      "deductions": [
        { "description": "Apple Developer Program (£79/yr)", "estimatedAmount": 79 },
        { "description": "JetBrains IDE annual licence", "estimatedAmount": 180 }
      ]
    }
  ]
}`;

// ─── Mock / fallback data ───────────────────────────────────────────────────

function getMockData(profile: UserProfile): TaxAnalysis {
  const alreadyClaiming: ExpenseCategory[] = [
    {
      emoji: "🚗",
      name: "Vehicle expenses",
      claimedAmount: 1240,
      claimedDescription: "Business mileage at 45p/mile has been included in your return.",
      adviceText: "If your vehicle is primarily for business, actual costs may exceed the flat rate.",
    },
    {
      emoji: "📱",
      name: "Phone & internet",
      claimedAmount: 420,
      claimedDescription: "A business proportion of phone and broadband costs has been deducted.",
      adviceText: "Ensure the business-use percentage is accurate — HMRC accepts reasonable estimates.",
    },
  ];
  if (profile.homeowner) {
    alreadyClaiming.push({
      emoji: "🏠",
      name: "Use of home",
      claimedAmount: 312,
      claimedDescription: "HMRC flat rate of £6/week applied for working from home.",
      adviceText: "As a homeowner, actual costs (heating, electricity, council tax proportion) may be higher.",
    });
  }
  return {
    taxYear: "2024/25",
    incomeType: "Self-employed",
    businessType: "Freelance professional",
    totalMissedDeductions: 3584,
    alreadyClaiming,
    canImprove: [
      {
        emoji: "💻",
        name: "Equipment & tech",
        deductions: [
          { description: "Laptop or computer replacement", estimatedAmount: 1200 },
          { description: "Monitor, keyboard & peripherals", estimatedAmount: 350 },
          { description: "Software subscriptions (annual)", estimatedAmount: 480 },
        ],
      },
      {
        emoji: "📚",
        name: "Training & development",
        deductions: [
          { description: "Online courses & certifications", estimatedAmount: 600 },
          { description: "Professional books & journals", estimatedAmount: 154 },
        ],
      },
      {
        emoji: "🤝",
        name: "Professional services",
        deductions: [
          { description: "Accountant / bookkeeper fees", estimatedAmount: 500 },
          { description: "Professional membership fees", estimatedAmount: 300 },
        ],
      },
    ],
  };
}

const FALLBACK_DEDUCTIONS: Record<string, { description: string; estimatedAmount: number }[]> = {
  default: [
    { description: "Professional software subscriptions", estimatedAmount: 480 },
    { description: "Professional membership fees", estimatedAmount: 300 },
    { description: "Business books and publications", estimatedAmount: 120 },
  ],
  "home office": [
    { description: "Proportion of heating and electricity", estimatedAmount: 480 },
    { description: "Proportion of broadband costs", estimatedAmount: 240 },
    { description: "Office furniture and equipment", estimatedAmount: 350 },
  ],
  training: [
    { description: "Online courses and certifications", estimatedAmount: 600 },
    { description: "Professional books and journals", estimatedAmount: 154 },
    { description: "Industry conference attendance", estimatedAmount: 250 },
  ],
  equipment: [
    { description: "Laptop or computer replacement", estimatedAmount: 1200 },
    { description: "Monitor and peripherals", estimatedAmount: 350 },
    { description: "Specialist tools and instruments", estimatedAmount: 280 },
  ],
};

function getFallbackDeductions(categoryName: string) {
  const lower = categoryName.toLowerCase();
  if (lower.includes("home") || lower.includes("office")) return FALLBACK_DEDUCTIONS["home office"];
  if (lower.includes("train") || lower.includes("develop") || lower.includes("course")) return FALLBACK_DEDUCTIONS["training"];
  if (lower.includes("equip") || lower.includes("tech") || lower.includes("tool")) return FALLBACK_DEDUCTIONS["equipment"];
  return FALLBACK_DEDUCTIONS["default"];
}

function fixCanImprove(canImprove: ExpenseCategory[]): ExpenseCategory[] {
  return canImprove.map((cat) => {
    if (!cat.deductions || cat.deductions.length < 2) {
      return { ...cat, deductions: getFallbackDeductions(cat.name) };
    }
    return cat;
  });
}

function sumDeductions(canImprove: ExpenseCategory[]): number {
  return canImprove.reduce(
    (sum, cat) => sum + (cat.deductions?.reduce((s, d) => s + (d.estimatedAmount || 0), 0) ?? 0),
    0
  );
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("No GEMINI_API_KEY — returning mock data");
    const body = await request.json().catch(() => ({}));
    const profile: UserProfile = body.profile || {};
    return NextResponse.json({ ...getMockData(profile), isExample: true, errorDetail: "GEMINI_API_KEY is not set" });
  }

  let profile: UserProfile = {
    married: false,
    dependants: false,
    studentLoan: false,
    homeowner: false,
    renter: false,
  };

  try {
    const body = await request.json();
    const { pdfBase64, profile: bodyProfile } = body as {
      pdfBase64: string | null;
      pdfName: string;
      profile: UserProfile;
    };
    profile = bodyProfile || profile;

    console.log("Starting analysis. PDF provided:", !!pdfBase64, "Profile:", JSON.stringify(profile));

    const ai = new GoogleGenAI({ apiKey });

    // ── Call 1: extract already-claimed expenses from PDF ───────────────────
    console.log("Call 1: extracting from PDF…");

    const pdfParts = [
      ...(pdfBase64
        ? [createPartFromBase64(pdfBase64, "application/pdf")]
        : [createPartFromText("No PDF provided. Generate realistic example data for a freelance consultant.")]),
      createPartFromText("Extract all claimed expenses and the business type from this Self Assessment return."),
    ];

    const call1 = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: pdfParts }],
      config: {
        systemInstruction: PROMPT_1,
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    const raw1 = (call1.text ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    if (!raw1) throw new Error("Call 1: Gemini returned empty response");

    const step1 = JSON.parse(raw1) as {
      taxYear: string;
      incomeType: string;
      businessType?: string;
      turnover?: number;
      alreadyClaiming: ExpenseCategory[];
    };
    console.log("Call 1 done. businessType:", step1.businessType, "alreadyClaiming:", step1.alreadyClaiming?.length);

    // ── Call 2: generate profession-specific canImprove suggestions ──────────
    console.log("Call 2: generating tailored suggestions for:", step1.businessType);

    const profileSummary = [
      profile.married && "married",
      profile.dependants && "has dependants",
      profile.homeowner && "homeowner",
      profile.renter && "renter",
      profile.studentLoan && "has student loan",
    ].filter(Boolean).join(", ") || "no additional profile info";

    const alreadyClaimedCategories = (step1.alreadyClaiming || []).map((c) => c.name).join(", ");

    const suggestionPrompt = `Business type: ${step1.businessType || "self-employed professional"}
Income type: ${step1.incomeType || "Self-employed"}
Already claiming: ${alreadyClaimedCategories || "nothing yet"}
User profile: ${profileSummary}

Generate specific missed deduction categories for this person.`;

    const call2 = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [createPartFromText(suggestionPrompt)] }],
      config: {
        systemInstruction: PROMPT_2,
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });

    const raw2 = (call2.text ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    if (!raw2) throw new Error("Call 2: Gemini returned empty response");

    const step2 = JSON.parse(raw2) as { canImprove: ExpenseCategory[] };
    console.log("Call 2 done. canImprove categories:", step2.canImprove?.length);

    const canImprove = fixCanImprove(step2.canImprove || []);

    const analysis: TaxAnalysis = {
      taxYear: step1.taxYear,
      incomeType: step1.incomeType,
      businessType: step1.businessType,
      turnover: step1.turnover,
      alreadyClaiming: step1.alreadyClaiming || [],
      canImprove,
      totalMissedDeductions: sumDeductions(canImprove),
    };

    return NextResponse.json(analysis);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Analysis error:", errMsg);
    console.error("Detail:", JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})));
    return NextResponse.json({ ...getMockData(profile), isExample: true, errorDetail: errMsg });
  }
}
