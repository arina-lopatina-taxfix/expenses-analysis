export interface DeductionItem {
  description: string;
  estimatedAmount: number;
}

export interface ExpenseCategory {
  emoji: string;
  name: string;
  claimedAmount?: number;
  claimedDescription?: string;
  adviceText?: string;
  deductions?: DeductionItem[];
}

export interface TaxAnalysis {
  taxYear: string;
  incomeType: string;
  businessType?: string;
  turnover?: number;
  totalMissedDeductions: number;
  alreadyClaiming: ExpenseCategory[];
  canImprove: ExpenseCategory[];
}

export interface UserProfile {
  married: boolean;
  dependants: boolean;
  studentLoan: boolean;
  homeowner: boolean;
  renter: boolean;
}
