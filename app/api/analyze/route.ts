import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, createPartFromBase64, createPartFromText } from "@google/genai";
import type { TaxAnalysis, ExpenseCategory, UserProfile } from "@/lib/types";

export const maxDuration = 120;

// ─── Single combined prompt ─────────────────────────────────────────────────

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

const COMBINED_PROMPT = `You are a UK tax expert. Read the uploaded SA100 Self Assessment PDF (if provided) and produce a complete tax analysis in one JSON response.

────────────────────────────────────────
PART 1 — EXTRACT FROM PDF
────────────────────────────────────────
Read every page carefully — SA100, SA102, SA103S, SA103F, SA105.

ELIGIBILITY — set isEligible based on which supplementary pages are present:
- isEligible = true  if SA103S or SA103F (self-employment) OR SA105 (UK property/landlord) is included
- isEligible = false if only SA102 (employment/PAYE) or no expense-bearing pages are present
- When no PDF is provided, default isEligible = true

incomeType: one short label describing the PRIMARY income source:
- SA103S or SA103F present → "Self-employed"
- SA105 present (and no SA103) → "Property income"
- SA102 present (and no SA103/SA105) → "Employment"
- Mixed → list the dominant one
- Unknown → "Unknown"

SA103S boxes: Box 17 (total allowable expenses), Box 18 (goods/materials), Box 19 (car/travel), Box 20 (other allowable expenses).
SA103F boxes: Box 17–30 covering wages, travel, rent, repairs, phone, advertising, interest, bank charges, accountancy, other.
SA105 boxes: Boxes 5–10 covering letting agent fees, legal fees, insurance, maintenance, other costs.

For each box with a NON-ZERO value create one alreadyClaiming entry:
- emoji: relevant emoji
- name: 2-4 words
- claimedAmount: exact GBP number from the box
- claimedDescription: what this box covers, max 80 chars
- adviceText: one tip to maximise this deduction, max 100 chars

If no expense boxes are filled, or no PDF provided, generate 2-3 realistic examples for a freelance consultant.

businessType: copy verbatim from the business description field on SA103S/SA103F. If not present, infer from the expense pattern. Be precise — "iOS mobile developer" not "consultant".

────────────────────────────────────────
PART 2 — GENERATE MISSED-DEDUCTION SUGGESTIONS
────────────────────────────────────────
Use the businessType, incomeType, and alreadyClaiming from Part 1 to generate tailored canImprove suggestions.

${HMRC_RATES}

CATEGORY LIST — start with these standard categories. Select ones relevant to this profession:
1. 🏠 Working from home
2. 📱 Office & Phone
3. 💻 Tech & Equipment
4. 🚗 Travel
5. 🔧 Materials & Stock
6. 👔 Clothing
7. 📋 Professional Services
8. 🛡️ Insurance
9. 📚 Training
10. 👥 Staff (if you have any)
11. 🎫 Subscriptions

PROFILE-BASED CATEGORIES (apply based on user profile in the message):
- Married → add: { "emoji": "💍", "name": "Marriage Allowance", "description": "Transfer unused Personal Allowance to your spouse and cut your combined tax bill.", "adviceText": "If your spouse earns under £12,570 this year, claim now — and backdate up to 4 tax years for up to £1,260 extra.", "deductions": [{ "description": "Transfer £1,260 Personal Allowance to higher-earning spouse", "estimatedAmount": 252 }, { "description": "Backdate claim up to 4 tax years", "estimatedAmount": 1008 }] }
- Has dependants → add: { "emoji": "👶", "name": "Child Benefits & Tax-Free Childcare", "description": "Government schemes that top up your childcare costs and reduce your tax bill.", "adviceText": "Earn over £60k? Check if the High Income Child Benefit Charge applies — and consider Tax-Free Childcare for up to £2,000/yr per child.", "deductions": [{ "description": "Tax-Free Childcare government top-up (20% on up to £8k/yr per child)", "estimatedAmount": 2000 }, { "description": "Check High Income Child Benefit Charge threshold (£60k)", "estimatedAmount": 0 }] }
- Has student loan → add: { "emoji": "🎓", "name": "Student Loan Planning", "description": "Understanding your repayment plan can prevent unnecessary overpayments.", "adviceText": "Check your Plan type — overpaying voluntarily only makes sense if your interest rate is higher than savings rates.", "deductions": [{ "description": "Review Plan 1/2/4 repayment threshold vs your income", "estimatedAmount": 0 }, { "description": "Voluntary overpayments only if income is stable and interest rate justifies it", "estimatedAmount": 0 }] }

WORKING FROM HOME — tailor deductions based on housing status from user profile:
- Homeowner: deductions MUST be ["Proportion of mortgage interest (home-office rooms ÷ total rooms)", "Council tax proportion", "Heating & electricity proportion", "Broadband — business-use share"]
- Renter: deductions MUST be ["Proportion of rent (business room usage % of floor area)", "Heating & electricity proportion", "Broadband — business-use share", "Contents insurance — business-use proportion"]
- Neither: deductions should be ["HMRC flat rate £6/wk (£312/yr)", "Broadband — business-use share", "Dedicated office furniture"]

RULES:
- Generate 2-4 deduction line items SPECIFIC to this person's profession — name real tools, platforms, registration bodies, courses, and services they would actually use.
- For each category write "description": one sentence FOR THIS SPECIFIC PROFESSION. Max 100 chars.
- For each category write "adviceText": one actionable tip for this specific person. Max 120 chars.
- Do NOT use generic labels — be specific (e.g. "Adobe Creative Cloud (£600/yr)", "Gas Safe Register annual fee").
- DEDUPLICATION IS CRITICAL: do NOT include any canImprove category that covers substantially the same area as something in alreadyClaiming. Examples: "Phone & office costs" = "📱 Office & Phone" → SKIP. "Vehicle expenses" = "🚗 Travel" → SKIP.
- Always return at least 4 canImprove categories.
- Do NOT include "Materials & Stock" for knowledge workers (developers, designers, writers, consultants, etc.).
- Do NOT include "Staff" if there is no indication the person employs others.

────────────────────────────────────────
RETURN FORMAT
────────────────────────────────────────
Return ONLY valid JSON, no markdown, no code fences:
{
  "taxYear": "2024/25",
  "incomeType": "Self-employed",
  "isEligible": true,
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
  ],
  "canImprove": [
    {
      "emoji": "💻",
      "name": "Tech & Equipment",
      "description": "Hardware and software licences essential for building and testing iOS apps.",
      "adviceText": "Buy equipment outright in one tax year to claim the full cost via Annual Investment Allowance.",
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
    isEligible: true,
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
    (sum, cat) => sum + (cat.deductions?.reduce((s, d) => s + (Number(d.estimatedAmount) || 0), 0) ?? 0),
    0
  );
}

// ─── Security ───────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  "https://expenses-analysis.vercel.app",
  "https://taxfix.com",
  "https://www.taxfix.com",
  "https://staging.taxfix.tech",
];

const MAX_PDF_BYTES = 4.5 * 1024 * 1024;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (process.env.NODE_ENV === "development") return true;
  return ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));
}

function isValidProfile(raw: unknown): raw is UserProfile {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const boolKeys = ["married", "dependants", "studentLoan", "homeowner", "renter"];
  return boolKeys.every((k) => {
    const v = (raw as Record<string, unknown>)[k];
    return v === undefined || typeof v === "boolean";
  });
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    const formData = await request.formData();
    const pdfFile = formData.get("pdf") as File | null;
    const profileRaw = (formData.get("profile") as string | null) ?? "{}";

    if (pdfFile && pdfFile.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "PDF exceeds maximum allowed size" }, { status: 413 });
    }

    let bodyProfile: UserProfile;
    try {
      bodyProfile = JSON.parse(profileRaw);
    } catch {
      return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
    }
    if (!isValidProfile(bodyProfile)) {
      return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
    }

    const pdfBase64 = pdfFile ? Buffer.from(await pdfFile.arrayBuffer()).toString("base64") : null;
    profile = bodyProfile || profile;

    console.log("Starting analysis. PDF provided:", !!pdfBase64, "Profile:", JSON.stringify(profile));

    const ai = new GoogleGenAI({ apiKey });

    // ── Single call: extract + suggest in one pass ──────────────────────────
    console.log("Single call: extracting and generating suggestions…");

    const profileText = `User profile:
- Married / civil partner: ${profile.married ? "YES" : "no"}
- Has dependants: ${profile.dependants ? "YES" : "no"}
- Homeowner (owns property): ${profile.homeowner ? "YES" : "no"}
- Renter (pays rent): ${profile.renter ? "YES" : "no"}
- Has student loan: ${profile.studentLoan ? "YES" : "no"}

${pdfBase64 ? "Analyse this Self Assessment return and generate the complete tax analysis." : "No PDF provided. Generate realistic example data for a freelance consultant, then generate tailored suggestions."}`;

    const parts = [
      ...(pdfBase64
        ? [createPartFromBase64(pdfBase64, "application/pdf")]
        : []),
      createPartFromText(profileText),
    ];

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: COMBINED_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    });

    const raw = (result.text ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    if (!raw) throw new Error("Gemini returned empty response");

    const parsed = JSON.parse(raw) as TaxAnalysis;
    console.log("Call done. businessType:", parsed.businessType, "alreadyClaiming:", parsed.alreadyClaiming?.length, "canImprove:", parsed.canImprove?.length);

    // Deduplication: remove canImprove categories that overlap with alreadyClaiming
    const claimedTokens = (parsed.alreadyClaiming || []).flatMap((c) =>
      c.name.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter((w) => w.length > 3)
    );
    const rawCanImprove = parsed.canImprove && parsed.canImprove.length > 0
      ? parsed.canImprove
      : getMockData(profile).canImprove;
    const deduped = rawCanImprove.filter((cat) => {
      const catTokens = cat.name.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter((w) => w.length > 3);
      const overlap = catTokens.some((t) => claimedTokens.includes(t));
      if (overlap) console.log(`Dedup filter removed: ${cat.name}`);
      return !overlap;
    });
    const canImprove = fixCanImprove(deduped.length >= 2 ? deduped : rawCanImprove);

    const analysis: TaxAnalysis = {
      taxYear: parsed.taxYear,
      incomeType: parsed.incomeType,
      isEligible: parsed.isEligible ?? true,
      businessType: parsed.businessType,
      turnover: parsed.turnover,
      alreadyClaiming: parsed.alreadyClaiming || [],
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
