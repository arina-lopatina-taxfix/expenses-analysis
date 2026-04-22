import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import type { TaxAnalysis, UserProfile } from "@/lib/types";

export const maxDuration = 60;

const HMRC_KNOWLEDGE = `
# HMRC Allowable Expense Guidelines for UK Self Assessment

## Self-Employed Expenses (gov.uk/expenses-if-youre-self-employed)

You can claim expenses for:

### Office, property and equipment
- Office costs (stationery, phone bills, postage)
- Computer equipment and software
- Work tools and instruments
- Business premises costs (rent, rates, utilities if separate from home)

### Use of home as office
- Flat rate: £6/week (£312/year) without records needed
- Actual costs: proportion of bills (heating, electricity, internet, council tax) based on rooms used and hours worked
- If home is your main work location, mortgage interest/rent apportioned

### Staff costs
- Employee salaries, wages, bonuses
- Employer NI contributions and pension contributions
- Subcontractor costs

### Travel
- Business mileage: 45p/mile for first 10,000 miles, 25p/mile after (cars)
- Actual vehicle costs (fuel, insurance, servicing, MOT, parking) if not using flat rate
- Public transport, taxis, hotels for business trips
- Cannot claim commuting costs (home to fixed work location)

### Clothing
- Protective clothing required for work
- Uniforms with company logo
- Costumes for performers
- NOT general business wear or clothing worn outside work

### Staff entertaining and staff training
- Staff entertainment (reasonable amounts)
- Training to improve or maintain current skills (NOT new qualifications)

### Marketing, advertising and subscriptions
- Business website costs, hosting, domain names
- Advertising and marketing materials
- Trade magazine subscriptions
- Professional membership fees

### Financial costs
- Bank charges and interest on business loans
- Credit card fees for business payments
- Accountancy and bookkeeping fees
- Legal fees for business contracts
- Professional indemnity insurance

### Pre-trading expenses
- Costs incurred before you started trading (treated as if incurred first day of trading)

## Simplified Expenses (gov.uk/simpler-income-tax-simplified-expenses)

Available for sole traders and some partnerships:

### Flat rate for working from home (monthly hours):
- 25-50 hours: £10/month
- 51-100 hours: £18/month
- 101+ hours: £26/month

### Vehicle flat rates:
- Cars/goods vehicles: 45p/mile (first 10,000), 25p/mile after
- Motorcycles: 24p/mile

## Property Income (gov.uk/guidance/income-tax-when-you-rent-out-a-property)

Allowable expenses for landlords:

### Revenue expenses (fully deductible):
- Letting agent fees and management fees
- Legal fees for short leases (under 50 years) and renewals
- Accountant fees
- Buildings and contents insurance
- Maintenance and repairs (not improvements)
- Cleaning between tenancies
- Gardening for upkeep (not improvements)
- Ground rent and service charges
- Council tax and utility bills (if you pay them)
- Advertising costs to find tenants

### Finance costs (restricted relief):
- Mortgage interest: basic rate tax credit only (20%) — not deducted from rental income

### Property Allowance:
- First £1,000 of property income is tax-free (property allowance)

## Common Missed Deductions by Business Type

### Freelancers / Consultants
- Software subscriptions (Slack, Zoom, project management tools)
- Professional development courses and certifications
- Home office equipment (desk, chair, monitor)
- Business books and publications
- Professional liability insurance

### Tradespeople / Construction
- Tools and equipment
- Workwear and PPE
- Vehicle costs (van, tools transport)
- Materials (if charged separately)
- Site safety equipment

### Creative / Media
- Camera, lighting, audio equipment
- Studio rental
- Props and costumes
- Software (Adobe, Final Cut, etc.)
- Portfolio and showreel costs

### Retail / E-commerce
- Stock (cost of goods sold)
- Packaging materials
- Platform fees (Amazon, eBay, Etsy)
- Payment processing fees
- Warehouse storage costs

### Healthcare / Therapy
- Professional registration fees (GMC, NMC, BACP, etc.)
- Clinical supervision costs
- CPD and continuing education
- Professional indemnity insurance
- Room rental for consultations
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
      "name": "Travel expenses",
      "claimedAmount": 1240,
      "claimedDescription": "Business mileage at 45p/mile claimed in box 19.",
      "adviceText": "If your vehicle is primarily for business, actual costs often exceed the flat rate for high-mileage users."
    }
  ],
  "canImprove": [
    {
      "emoji": "💻",
      "name": "Software & tools",
      "deductions": [
        { "description": "Design software (Figma, Adobe CC)", "estimatedAmount": 600 },
        { "description": "Project management tools (Notion, Slack)", "estimatedAmount": 180 },
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
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

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

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    });

    const rawText = result.response.text().trim();
    console.log("Gemini raw response length:", rawText.length);
    console.log("Gemini response preview:", rawText.slice(0, 500));

    const analysis: TaxAnalysis = JSON.parse(rawText);

    console.log("Parsed analysis — alreadyClaiming count:", analysis.alreadyClaiming?.length);
    console.log("Parsed analysis — canImprove count:", analysis.canImprove?.length);
    analysis.canImprove?.forEach((cat, i) => {
      console.log(`  canImprove[${i}] "${cat.name}": ${cat.deductions?.length ?? 0} deductions`);
    });

    const fixed = validateAndFixAnalysis(analysis);
    return NextResponse.json(fixed);
  } catch (error) {
    console.error("Gemini analysis error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ ...getMockData(profile), isExample: true });
  }
}
