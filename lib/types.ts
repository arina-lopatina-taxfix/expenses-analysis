export interface DeductionItem {
  description: string;
  estimatedAmount: number;
}

export interface ExpenseCategory {
  emoji: string;
  name: string;
  description?: string;
  claimedAmount?: number;
  claimedDescription?: string;
  adviceText?: string;
  deductions?: DeductionItem[];
}

export interface TaxAnalysis {
  taxYear: string;
  incomeType: string;
  isEligible: boolean;
  isNotTaxReturn?: boolean;
  businessType?: string;
  turnover?: number;
  totalMissedDeductions: number;
  alreadyClaiming: ExpenseCategory[];
  canImprove: ExpenseCategory[];
  isExample?: boolean;
  errorDetail?: string;
}

export interface UserProfile {
  married: boolean;
  dependants: boolean;
  studentLoan: boolean;
  homeowner: boolean;
  renter: boolean;
}
