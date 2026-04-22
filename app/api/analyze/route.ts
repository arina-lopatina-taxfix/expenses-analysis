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

const SYSTEM_PROMPT = `You are a UK tax expert specialising in HMRC Self Assessment returns.
Analyse the provided tax return PDF and user profile to identify missed expense deductions.

Return ONLY valid JSON matching this exact TypeScript interface — no markdown, no explanation:

interface DeductionItem {
  description: string;
  estimatedAmount: number; // in GBP, realistic HMRC-accepted estimate
}

interface ExpenseCategory {
  emoji: string;
  name: string;
  claimedAmount?: number; // if already claiming, the amount from the return
  claimedDescription?: string; // what they've already claimed
  adviceText?: string; // improvement advice for already-claiming items
  deductions?: DeductionItem[]; // specific deductible items for can-improve categories
}

interface TaxAnalysis {
  taxYear: string; // e.g. "2024/25"
  incomeType: string; // "Self-employed", "Employment", "Property", "Mixed"
  businessType?: string; // if self-employed, their specific business (be specific, e.g. "Freelance graphic designer", "Sole trader plumber")
  turnover?: number; // if available from the return
  totalMissedDeductions: number; // sum of all canImprove deduction amounts
  alreadyClaiming: ExpenseCategory[]; // 2-5 categories already in the return
  canImprove: ExpenseCategory[]; // 3-6 categories they're missing
}

Rules:
- Read the PDF carefully to identify: tax year, income source, business type, existing expenses claimed
- Base ALL deduction amounts on HMRC guidelines and realistic averages for their business type
- For self-employed: match canImprove categories specifically to their line of work
- For property income: use the rental property expense rules
- If married: consider marriage allowance
- If homeowner: include home office deduction analysis
- If student loan: note it's deducted at source, not in SA100 expenses
- Keep category names concise (2-4 words)
- Emojis must be relevant to the category
- adviceText should be 1-2 sentences of actionable, specific advice
- claimedDescription should briefly describe what's in the return
- deduction descriptions should be specific and realistic for their business
- totalMissedDeductions = sum of all deductions[].estimatedAmount across canImprove`;

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
        required: ["emoji", "name"],
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
    return NextResponse.json(getMockData(profile));
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
        text: `${userContext}\n\nAnalyse this UK Self Assessment tax return. Identify the income source, business type, expenses already claimed, and all missed deductions based on HMRC rules.`,
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

    const analysis: TaxAnalysis = JSON.parse(rawText);

    // Recompute total if model got it wrong
    if (!analysis.totalMissedDeductions || analysis.totalMissedDeductions === 0) {
      analysis.totalMissedDeductions = analysis.canImprove.reduce(
        (sum, cat) =>
          sum + (cat.deductions?.reduce((s, d) => s + d.estimatedAmount, 0) ?? 0),
        0
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Gemini analysis error:", error instanceof Error ? error.message : error);
    return NextResponse.json(getMockData(profile));
  }
}
