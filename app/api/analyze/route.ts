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

const PROMPT_2 = `You are a UK tax expert specialising in HMRC expense optimisation.

${HMRC_RATES}

FIXED CATEGORY LIST — use ONLY these categories (with exact emoji and name) for self-employed people. Select the ones relevant to this profession and skip any that clearly don't apply.

1. 🏠 Working from home — proportion of heating, electricity, broadband, council tax (or flat £6/wk)
2. 📱 Office & Phone — stationery, postage, phone bills, broadband, admin software
3. 💻 Tech & Equipment — laptops, monitors, specialist tools, machinery, equipment
4. 🚗 Travel — business mileage, train/bus fares, parking, overnight stays (not commuting)
5. 🔧 Materials & Stock — goods bought for resale, raw materials, components, consumables
6. 👔 Clothing — uniforms, protective clothing, specialist attire (not everyday wear)
7. 📋 Professional Services — accountant, solicitor, bookkeeper, business consulting fees (accountant fees are also deductible)
8. 🛡️ Insurance — public liability, professional indemnity, equipment cover
9. 📚 Training — courses and qualifications to maintain or improve current skills
10. 👥 Staff (if you have any) — wages, PAYE, subcontractor costs, employer NI contributions
11. 🎫 Subscriptions — professional memberships, trade bodies, specialist publications

PROFILE-BASED CATEGORIES — add these only if the user profile flag is YES:
- Married → add: 💍 Marriage Allowance — transfer up to £1,260 of Personal Allowance if one spouse earns under £12,570/yr. Deductions: ["Check if partner earns under £12,570 this year", "Claim backdated for up to 4 tax years"]
- Has dependants → add: 👶 Child Benefits & Tax-Free Childcare — understand High Income Child Benefit Charge and claim Tax-Free Childcare top-up. Deductions: ["Tax-Free Childcare (government adds 20%)", "Check High Income Child Benefit Charge threshold (£60k)"]
- Has student loan → add: 🎓 Student Loan Planning — understand repayment thresholds to avoid overpaying. Deductions: ["Review Plan 1/2/4 repayment threshold vs your income", "Consider voluntary overpayments only if income is stable"]

RULES:
- For each selected category generate 2-4 deduction line items SPECIFIC to this person's profession — name real tools, platforms, registration bodies, courses, and services they would actually use.
- Do NOT use generic labels like "software subscriptions" or "professional fees" — be specific (e.g. "Adobe Creative Cloud (£600/yr)", "Gas Safe Register annual fee", "GMC annual retention fee (£446)").
- Do NOT include any category the person is already claiming.
- Do NOT include "Materials & Stock" for knowledge workers (developers, designers, writers, consultants, therapists, accountants, etc.).
- Do NOT include "Staff" if there is no indication the person employs others.

SPECIFICITY REFERENCE:
- iOS/Android developer → Tech: "Apple Developer Program (£79/yr)", "Xcode / simulator hardware"; Training: "WWDC tickets or recordings", "Udemy iOS courses"; Subscriptions: "GitHub Pro (£48/yr)", "Stack Overflow Teams"
- Plumber/gas engineer → Materials: "Flux, solder, push-fit fittings", "Pipe insulation lagging"; Training: "Gas Safe Register annual levy", "18th Edition update course"; Insurance: "Public liability (£1M minimum)"
- Therapist/counsellor → Professional Services: "BACP annual membership (£118)", "Clinical supervision sessions (£50–£80/session)"; Insurance: "Professional indemnity (£1M+)"; Training: "CPD accredited workshops"
- Graphic/UX designer → Tech: "Adobe Creative Cloud (£660/yr)", "Figma Professional (£144/yr)"; Subscriptions: "Dribbble Pro portfolio", "Stock imagery licence (Shutterstock/Getty)"
- GP/private doctor → Subscriptions: "GMC annual retention fee (£446)", "BMA membership"; Insurance: "Medical indemnity (MDU/MPS ~£1,500+/yr)"; Training: "CPD accredited courses"
- Freelance writer/journalist → Subscriptions: "NUJ membership (press card)", "Specialist research databases"; Tech: "Transcription software (Otter.ai/Rev)", "Noise-cancelling headset"
- Accountant/bookkeeper → Subscriptions: "ICAEW/ACCA annual subscription", "Practice management software (Xero/QuickBooks)"; Training: "CPD hours (mandatory 40/yr)"

Return ONLY valid JSON, no markdown, no code fences:
{
  "canImprove": [
    {
      "emoji": "💻",
      "name": "Tech & Equipment",
      "deductions": [
        { "description": "Apple Developer Program (£79/yr)", "estimatedAmount": 79 },
        { "description": "External monitor and peripherals", "estimatedAmount": 350 }
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
        maxOutputTokens: 8192,
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

    const alreadyClaimingDetail = (step1.alreadyClaiming || [])
      .map((c) => `  - ${c.name} (£${c.claimedAmount ?? 0}): ${c.claimedDescription ?? ""}`)
      .join("\n") || "  Nothing claimed yet";

    const suggestionPrompt = `Business type: ${step1.businessType || "self-employed professional"}
Income type: ${step1.incomeType || "Self-employed"}
Annual turnover: ${step1.turnover ? `£${step1.turnover}` : "unknown"}

Already claimed expenses:
${alreadyClaimingDetail}

User profile (from their self-reported answers):
- Married / civil partner: ${profile.married ? "YES" : "no"}
- Has dependants: ${profile.dependants ? "YES" : "no"}
- Homeowner (owns property): ${profile.homeowner ? "YES" : "no"}
- Renter (pays rent): ${profile.renter ? "YES" : "no"}
- Has student loan: ${profile.studentLoan ? "YES" : "no"}

Generate specific missed deduction categories for this person. Apply all relevant user profile rules from your instructions (home office for homeowners/renters, Marriage Allowance for married users, etc.).`;

    const call2 = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [createPartFromText(suggestionPrompt)] }],
      config: {
        systemInstruction: PROMPT_2,
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 8192,
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
