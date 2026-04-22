import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import type { TaxAnalysis, UserProfile } from "@/lib/types";

export const maxDuration = 60;

const HMRC_KNOWLEDGE = `
HMRC RATES (UK Self Assessment):
- Mileage: 45p/mile (first 10k), 25p after. Motorcycles: 24p/mile.
- Home office flat rate: £6/week (£312/yr). Simplified: 25-50h=£10/mo, 51-100h=£18/mo, 101+h=£26/mo.
- Property allowance: first £1,000 of rental income tax-free.
- Mortgage interest: 20% basic-rate tax credit only (not deducted from rental income).
- Marriage Allowance: £1,260 transferable if one spouse earns under Personal Allowance.

ALLOWABLE EXPENSES BY TYPE:
- Self-employed: office costs, equipment, software, travel (not commuting), clothing (protective/uniform only), staff, marketing, professional fees, bank charges, training (maintain skills, not new qualifications), home office proportion.
- Property: letting agent fees, insurance, maintenance (not improvements), legal fees, council tax/utilities if landlord pays.

MISSED DEDUCTIONS BY BUSINESS TYPE:
- Freelancer/consultant: software subs, professional memberships, home office, training courses, marketing.
- Tradesperson: tools, workwear/PPE, van, materials, site safety.
- Creative: design/editing software, equipment, portfolio, studio.
- Healthcare: registration fees (GMC/NMC/BACP), supervision, CPD, indemnity insurance.
- Retail/e-commerce: stock, packaging, platform fees (Amazon/eBay/Etsy), payment processing.
- Property investor: letting fees, maintenance, insurance, mortgage interest credit.
`;

const SYSTEM_PROMPT = `You are a UK tax expert specialising in HMRC Self Assessment returns. Analyse the uploaded PDF and user profile.

## STEP 1 — READ THE PDF CAREFULLY

Look at every page of the uploaded SA100 tax return and any supplementary pages (SA103S, SA103F, SA105):

**SA103S – Self-employment (short):**
- Box 17: Total allowable expenses (if a single figure is given)
- Box 18: Cost of goods/materials bought for resale
- Box 19: Car, van and travel expenses
- Box 20: Other allowable expenses (phone, office, advertising, etc.)

**SA103F – Self-employment (full):**
- Box 17: Cost of goods bought for resale
- Box 18: Construction industry subcontractors
- Box 19: Wages, salaries and other staff costs
- Box 20: Car, van and travel expenses
- Box 21: Rent, rates, power and insurance costs
- Box 22: Repairs and renewals of property and equipment
- Box 23: Phone, fax, stationery and other office costs
- Box 24: Advertising and business entertainment costs
- Box 25: Interest on bank and other loans
- Box 26: Bank, credit card and other financial charges
- Box 27: Irrecoverable debts written off
- Box 28: Accountancy, legal and other professional fees
- Box 29: Depreciation and loss or profit on sales of assets
- Box 30: Other business expenses

**SA105 – Property income:**
- Box 5–10: Letting agent fees, legal fees, insurance, maintenance, other costs

For each box that has a non-zero value, create one entry in alreadyClaiming with:
- The category name (concise, 2–4 words)
- The exact GBP amount from that box
- A brief claimedDescription of what that box covers
- An adviceText tip on how to maximise that deduction

If a box is zero or blank, ignore it — do NOT include it in alreadyClaiming.
Aim for 2–5 alreadyClaiming entries from what you actually see in the PDF.
If no PDF is provided, generate realistic example values for a freelance consultant.

## STEP 2 — IDENTIFY MISSED DEDUCTIONS

Based on the income type, business type, and user profile, identify 4–6 expense categories the person is NOT claiming but could legitimately claim under HMRC rules.

For EACH canImprove category you MUST provide a deductions array with EXACTLY 2–4 specific line items, each with a realistic GBP amount. Never return an empty deductions array.

Tailor entirely to their business type:
- Freelancer/consultant → software subscriptions, professional memberships, training courses, home office, marketing
- Tradesperson → tools & equipment, workwear/PPE, van costs, materials, site safety
- Creative/designer → design software, equipment, portfolio costs, studio rent
- Healthcare/therapist → registration fees, supervision, CPD, indemnity insurance
- Retailer/e-commerce → stock, packaging, platform fees, storage, payment processing
- Property investor → letting agent fees, maintenance, insurance, mortgage interest credit

Use the user profile:
- homeowner → "Home Office" with actual-cost calculation (heating, electricity, council tax, mortgage interest proportion)
- renter → "Home Office" with flat-rate or proportion-of-rent method
- married → note Marriage Allowance (£1,260 transferable allowance) if one spouse earns under the Personal Allowance
- dependants → note childcare considerations if relevant
- student loan → do NOT include as a deduction

## OUTPUT FORMAT

Return ONLY valid JSON — no markdown, no explanation, no code fences.

STRICT LENGTH LIMITS — keep output compact:
- name: 2–4 words, max 30 characters
- claimedDescription: max 80 characters — factual only, no elaboration
- adviceText: max 100 characters — 1 short sentence only
- deduction description: max 50 characters
- businessType: max 40 characters

Exact structure required:
{
  "taxYear": "2024/25",
  "incomeType": "Self-employed",
  "businessType": "Freelance UX designer",
  "turnover": 45000,
  "totalMissedDeductions": 3500,
  "alreadyClaiming": [
    {
      "emoji": "🚗",
      "name": "Travel",
      "claimedAmount": 1240,
      "claimedDescription": "Business mileage at 45p/mile (box 19).",
      "adviceText": "Actual costs may exceed the flat rate for high-mileage use."
    }
  ],
  "canImprove": [
    {
      "emoji": "💻",
      "name": "Software & tools",
      "deductions": [
        { "description": "Design software (Figma, Adobe CC)", "estimatedAmount": 600 },
        { "description": "Project management (Notion, Slack)", "estimatedAmount": 180 },
        { "description": "Cloud storage and backup", "estimatedAmount": 120 }
      ]
    }
  ]
}

CRITICAL: totalMissedDeductions MUST equal the exact sum of ALL estimatedAmount values across ALL canImprove deductions arrays.`;

function getMockData(profile: UserProfile): TaxAnalysis {
  const alreadyClaiming = [
    {
      emoji: "🚗",
      name: "Vehicle expenses",
      claimedAmount: 1240,
      claimedDescription:
        "Business mileage at 45p/mile has been included in your return.",
      adviceText:
        "If your vehicle is primarily for business, calculate actual costs — this often exceeds the flat rate for high-mileage users.",
    },
    {
      emoji: "📱",
      name: "Phone & internet",
      claimedAmount: 420,
      claimedDescription:
        "A business proportion of your phone and broadband costs has been deducted.",
      adviceText:
        "Ensure the business-use percentage is accurate. If usage has grown, recalculate — HMRC accepts estimates backed by reasonable methodology.",
    },
  ];

  if (profile.homeowner) {
    alreadyClaiming.push({
      emoji: "🏠",
      name: "Use of home",
      claimedAmount: 312,
      claimedDescription:
        "You've applied the HMRC flat rate of £6/week for working from home.",
      adviceText:
        "As a homeowner, calculating actual costs (proportion of heating, electricity, council tax, mortgage interest) may yield a significantly higher deduction.",
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
  "training": [
    { description: "Online courses and certifications", estimatedAmount: 600 },
    { description: "Professional books and journals", estimatedAmount: 154 },
    { description: "Industry conference attendance", estimatedAmount: 250 },
  ],
  "equipment": [
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

function validateAndFixAnalysis(analysis: TaxAnalysis): TaxAnalysis {
  // Ensure every canImprove category has at least 2 deduction items
  analysis.canImprove = analysis.canImprove.map((cat) => {
    if (!cat.deductions || cat.deductions.length < 2) {
      console.warn(`canImprove category "${cat.name}" had ${cat.deductions?.length ?? 0} deductions — applying fallback`);
      return { ...cat, deductions: getFallbackDeductions(cat.name) };
    }
    return cat;
  });

  // Recompute totalMissedDeductions from actual deduction items
  const computed = analysis.canImprove.reduce(
    (sum, cat) => sum + (cat.deductions?.reduce((s, d) => s + (d.estimatedAmount || 0), 0) ?? 0),
    0
  );
  analysis.totalMissedDeductions = computed;

  return analysis;
}

const RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    taxYear: { type: SchemaType.STRING },
    incomeType: { type: SchemaType.STRING },
    businessType: { type: SchemaType.STRING },
    turnover: { type: SchemaType.NUMBER },
    totalMissedDeductions: { type: SchemaType.NUMBER },
    alreadyClaiming: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          emoji: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          claimedAmount: { type: SchemaType.NUMBER },
          claimedDescription: { type: SchemaType.STRING },
          adviceText: { type: SchemaType.STRING },
        },
        required: ["emoji", "name"],
      },
    },
    canImprove: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          emoji: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          deductions: {
            type: SchemaType.ARRAY,
            minItems: 2,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                description: { type: SchemaType.STRING },
                estimatedAmount: { type: SchemaType.NUMBER },
              },
              required: ["description", "estimatedAmount"],
            },
          },
        },
        required: ["emoji", "name", "deductions"],
      },
    },
  },
  required: ["taxYear", "incomeType", "totalMissedDeductions", "alreadyClaiming", "canImprove"],
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("No GEMINI_API_KEY — returning mock data");
    const body = await request.json().catch(() => ({}));
    const profile: UserProfile = body.profile || {};
    return NextResponse.json({ ...getMockData(profile), isExample: true });
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

    console.log("Starting Gemini analysis. PDF provided:", !!pdfBase64, "Profile:", JSON.stringify(profile));

    const genAI = new GoogleGenerativeAI(apiKey);

    const profileSummary = [
      profile.married && "married",
      profile.dependants && "has dependants",
      profile.studentLoan && "has student loan",
      profile.homeowner && "homeowner",
      profile.renter && "renter",
    ]
      .filter(Boolean)
      .join(", ");

    const userContext = profileSummary
      ? `User profile: ${profileSummary}.`
      : "No additional profile information provided.";

    const parts = [
      { text: `# HMRC Expense Guidelines\n\n${HMRC_KNOWLEDGE}` },
      ...(pdfBase64
        ? [{ inlineData: { mimeType: "application/pdf" as const, data: pdfBase64 } }]
        : [{ text: "No PDF provided. Generate a realistic example analysis for a freelance consultant." }]),
      {
        text: `${userContext}\n\nAnalyse this UK Self Assessment tax return following the two-step process in your instructions. Extract all expense boxes from the PDF for alreadyClaiming. Then identify 4-6 missed deduction categories for canImprove, each with 2-4 specific line items and GBP amounts.`,
      },
    ];

    const generationConfig = {
      responseMimeType: "application/json" as const,
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 4096,
    };

    // Try gemini-2.0-flash first, fall back to gemini-1.5-flash on quota errors
    async function callGemini(modelName: string) {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_PROMPT });
      return model.generateContent({ contents: [{ role: "user", parts }], generationConfig });
    }

    let result;
    try {
      result = await callGemini("gemini-2.0-flash");
    } catch (primaryError) {
      const msg = primaryError instanceof Error ? primaryError.message : String(primaryError);
      if (msg.includes("429") || msg.includes("quota") || msg.includes("exhausted") || msg.includes("RESOURCE_EXHAUSTED")) {
        console.warn("gemini-2.0-flash quota exhausted, falling back to gemini-1.5-flash");
        result = await callGemini("gemini-1.5-flash");
      } else {
        throw primaryError;
      }
    }

    const rawText = result.response.text().trim();
    console.log("Gemini raw response length:", rawText.length);
    console.log("Gemini finish reason:", result.response.candidates?.[0]?.finishReason);

    if (!rawText) throw new Error("Gemini returned empty response");

    const analysis: TaxAnalysis = JSON.parse(rawText);

    console.log("Parsed analysis — alreadyClaiming count:", analysis.alreadyClaiming?.length);
    console.log("Parsed analysis — canImprove count:", analysis.canImprove?.length);
    analysis.canImprove?.forEach((cat, i) => {
      console.log(`  canImprove[${i}] "${cat.name}": ${cat.deductions?.length ?? 0} deductions`);
    });

    const fixed = validateAndFixAnalysis(analysis);
    return NextResponse.json(fixed);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    // Log every property so Vercel function logs show the full Gemini error code
    const errDetail = JSON.stringify(error, Object.getOwnPropertyNames(error ?? {}));
    console.error("Gemini analysis error message:", errMsg);
    console.error("Gemini analysis error detail:", errDetail);
    return NextResponse.json({ ...getMockData(profile), isExample: true, errorDetail: errMsg });
  }
}
