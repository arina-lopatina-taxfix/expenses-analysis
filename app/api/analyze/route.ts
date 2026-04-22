import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, createPartFromBase64, createPartFromText } from "@google/genai";
import type { TaxAnalysis, UserProfile } from "@/lib/types";

export const maxDuration = 120;

const HMRC_KNOWLEDGE = `
HMRC RATES (UK Self Assessment):
- Mileage: 45p/mile (first 10k miles), 25p/mile after. Motorcycles: 24p/mile.
- Home office flat rate: £6/week (£312/yr). Simplified: 25-50h=£10/mo, 51-100h=£18/mo, 101+h=£26/mo.
- Property allowance: first £1,000 of rental income tax-free.
- Mortgage interest: 20% basic-rate tax credit only.
- Marriage Allowance: £1,260 transferable if one spouse earns under Personal Allowance.

ALLOWABLE EXPENSES:
- Self-employed: office costs, equipment, software, business travel (not commuting), protective clothing/uniform, staff, marketing, professional fees, bank charges, skills training, home office proportion.
- Property: letting agent fees, insurance, maintenance (not improvements), legal fees, council tax/utilities if landlord pays.

COMMON MISSED DEDUCTIONS BY TYPE:
- Freelancer/consultant: software subs, professional memberships, home office, training, marketing.
- Tradesperson: tools, workwear/PPE, van, materials, site safety.
- Creative: design/editing software, equipment, portfolio, studio.
- Healthcare: registration fees (GMC/NMC/BACP), supervision, CPD, indemnity insurance.
- Retail/e-commerce: stock, packaging, platform fees, payment processing.
- Property investor: letting fees, maintenance, insurance, mortgage interest credit.
`;

const SYSTEM_PROMPT = `You are a UK tax expert specialising in HMRC Self Assessment returns. Analyse the uploaded PDF and user profile.

## STEP 1 — EXTRACT ALREADY-CLAIMED EXPENSES FROM THE PDF

Read every page of the SA100 and supplementary pages (SA103S, SA103F, SA105).

SA103S boxes to check:
- Box 17: Total allowable expenses
- Box 18: Cost of goods/materials
- Box 19: Car, van and travel
- Box 20: Other allowable expenses

SA103F boxes to check:
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

SA105 boxes to check:
- Boxes 5–10: Letting agent fees, legal fees, insurance, maintenance, other costs

For each box with a NON-ZERO value: create one alreadyClaiming entry with emoji, name (2-4 words), the exact GBP amount, a brief claimedDescription (max 80 chars), and an adviceText tip (max 100 chars, 1 sentence).

If the PDF has no expense boxes filled in, or no PDF is provided, generate 2-3 realistic example entries for a freelance consultant.

## STEP 2 — IDENTIFY MISSED DEDUCTIONS

Identify 4-6 expense categories NOT currently claimed but legitimately claimable. For each, provide 2-4 specific line items with GBP amounts. Tailor to the user's business type and profile.

## OUTPUT

Return ONLY valid JSON with this exact structure — no markdown, no code fences:

{
  "taxYear": "2024/25",
  "incomeType": "Self-employed",
  "businessType": "Freelance consultant",
  "turnover": 45000,
  "totalMissedDeductions": 3500,
  "alreadyClaiming": [
    {
      "emoji": "🚗",
      "name": "Travel expenses",
      "claimedAmount": 1240,
      "claimedDescription": "Business mileage at 45p/mile (SA103S box 19).",
      "adviceText": "Actual costs may exceed flat rate for high-mileage use."
    }
  ],
  "canImprove": [
    {
      "emoji": "💻",
      "name": "Software & tools",
      "deductions": [
        { "description": "Design software (Figma, Adobe CC)", "estimatedAmount": 600 },
        { "description": "Cloud storage and backup", "estimatedAmount": 120 }
      ]
    }
  ]
}

CRITICAL: totalMissedDeductions MUST equal the exact sum of all estimatedAmount values.`;

const MOCK_ALREADY_CLAIMING = [
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

function getMockData(profile: UserProfile): TaxAnalysis {
  const alreadyClaiming = [...MOCK_ALREADY_CLAIMING];
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

function validateAndFixAnalysis(analysis: TaxAnalysis): TaxAnalysis {
  analysis.canImprove = analysis.canImprove.map((cat) => {
    if (!cat.deductions || cat.deductions.length < 2) {
      return { ...cat, deductions: getFallbackDeductions(cat.name) };
    }
    return cat;
  });
  const computed = analysis.canImprove.reduce(
    (sum, cat) => sum + (cat.deductions?.reduce((s, d) => s + (d.estimatedAmount || 0), 0) ?? 0),
    0
  );
  analysis.totalMissedDeductions = computed;
  return analysis;
}

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

    console.log("Starting Gemini analysis. PDF provided:", !!pdfBase64, "Profile:", JSON.stringify(profile));

    const ai = new GoogleGenAI({ apiKey });

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
      createPartFromText(`# HMRC Expense Guidelines\n\n${HMRC_KNOWLEDGE}`),
      ...(pdfBase64
        ? [createPartFromBase64(pdfBase64, "application/pdf")]
        : [createPartFromText("No PDF provided. Generate realistic example entries for a freelance consultant.")]),
      createPartFromText(
        `${userContext}\n\nAnalyse this UK Self Assessment tax return. Extract all non-zero expense boxes into alreadyClaiming. Then identify 4-6 missed deduction categories for canImprove, each with 2-4 line items and GBP amounts.`
      ),
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    });

    const rawText = (response.text ?? "").trim();
    console.log("Gemini response length:", rawText.length);

    if (!rawText) throw new Error("Gemini returned empty response");

    const cleanText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const analysis: TaxAnalysis = JSON.parse(cleanText);
    console.log("alreadyClaiming count:", analysis.alreadyClaiming?.length, "canImprove count:", analysis.canImprove?.length);

    return NextResponse.json(validateAndFixAnalysis(analysis));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Gemini error:", errMsg);
    console.error("Gemini error detail:", JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})));
    const userFacingError = errMsg;
    return NextResponse.json({ ...getMockData(profile), isExample: true, errorDetail: userFacingError });
  }
}
