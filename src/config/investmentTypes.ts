export type InvestmentType =
  | "mutual_fund"
  | "gold"
  | "fd"
  | "stocks"
  | "ppf_epf"
  | "real_estate";

export interface CalcParams {
  monthlySip?: number;
  lumpsum?: number;
  annualContribution?: number;
  currentAmount: number;
  tenureYears: number;
  returnRate: number;
}

export interface InvestmentTypeMeta {
  label: string;
  icon: string;
  color: string;
  fields: ("name" | "tenure" | "return_rate" | "sip" | "lumpsum" | "annual_contribution" | "include_net_worth")[];
  defaultReturn: number;
  description: string;
  placeholder: string;
  calc: (params: CalcParams) => number;
}

function sipMaturity(sip: number, months: number, monthlyRate: number): number {
  if (monthlyRate <= 0) return sip * months;
  const factor = Math.pow(1 + monthlyRate, months);
  return sip * ((factor - 1) / monthlyRate) * (1 + monthlyRate);
}

function lumpsumMaturity(principal: number, years: number, annualRate: number): number {
  if (annualRate <= 0) return principal;
  return principal * Math.pow(1 + annualRate / 100, years);
}

export const INVESTMENT_TYPE_META: Record<InvestmentType, InvestmentTypeMeta> = {
  mutual_fund: {
    label: "Mutual Fund",
    icon: "chart-line",
    color: "#8b5cf6",
    fields: ["name", "tenure", "return_rate", "sip", "include_net_worth"],
    defaultReturn: 12,
    description: "Systematic Investment Plan in equity or hybrid funds",
    placeholder: "e.g. Parag Parikh Flexi Cap",
    calc: ({ monthlySip, currentAmount, tenureYears, returnRate }) => {
      const months = Math.round(tenureYears * 12);
      const monthlyRate = returnRate / 100 / 12;
      const sip = monthlySip || 0;
      const sipValue = sipMaturity(sip, months, monthlyRate);
      const existingValue = lumpsumMaturity(currentAmount, tenureYears, returnRate);
      return Math.round(sipValue + existingValue);
    },
  },
  gold: {
    label: "Gold",
    icon: "gold",
    color: "#f59e0b",
    fields: ["name", "tenure", "return_rate", "sip", "include_net_worth"],
    defaultReturn: 8,
    description: "Physical gold, digital gold, or Gold ETFs",
    placeholder: "e.g. Digital Gold Savings",
    calc: ({ monthlySip, currentAmount, tenureYears, returnRate }) => {
      const months = Math.round(tenureYears * 12);
      const monthlyRate = returnRate / 100 / 12;
      const sip = monthlySip || 0;
      const sipValue = sipMaturity(sip, months, monthlyRate);
      const existingValue = lumpsumMaturity(currentAmount, tenureYears, returnRate);
      return Math.round(sipValue + existingValue);
    },
  },
  fd: {
    label: "Fixed Deposit",
    icon: "bank",
    color: "#3b82f6",
    fields: ["name", "tenure", "return_rate", "lumpsum", "include_net_worth"],
    defaultReturn: 7,
    description: "Bank FD or corporate deposit with fixed returns",
    placeholder: "e.g. SBI 5Y Tax-Saver FD",
    calc: ({ lumpsum, currentAmount, tenureYears, returnRate }) => {
      const principal = (lumpsum || 0) + currentAmount;
      return Math.round(lumpsumMaturity(principal, tenureYears, returnRate));
    },
  },
  stocks: {
    label: "Stocks",
    icon: "stocking",
    color: "#10b981",
    fields: ["name", "tenure", "return_rate", "sip", "include_net_worth"],
    defaultReturn: 15,
    description: "Direct equity or ETF investments",
    placeholder: "e.g. Nifty 50 Index",
    calc: ({ monthlySip, currentAmount, tenureYears, returnRate }) => {
      const months = Math.round(tenureYears * 12);
      const monthlyRate = returnRate / 100 / 12;
      const sip = monthlySip || 0;
      const sipValue = sipMaturity(sip, months, monthlyRate);
      const existingValue = lumpsumMaturity(currentAmount, tenureYears, returnRate);
      return Math.round(sipValue + existingValue);
    },
  },
  ppf_epf: {
    label: "PPF / EPF",
    icon: "safe",
    color: "#06b6d4",
    fields: ["name", "tenure", "return_rate", "annual_contribution", "include_net_worth"],
    defaultReturn: 7.1,
    description: "Public Provident Fund or Employee Provident Fund",
    placeholder: "e.g. PPF Account",
    calc: ({ annualContribution, currentAmount, tenureYears, returnRate }) => {
      const rate = returnRate / 100;
      let total = currentAmount;
      const years = Math.floor(tenureYears);
      for (let i = 0; i < years; i++) {
        total = total * (1 + rate) + (annualContribution || 0);
      }
      return Math.round(total);
    },
  },
  real_estate: {
    label: "Real Estate",
    icon: "home-city",
    color: "#f97316",
    fields: ["name", "tenure", "return_rate", "lumpsum", "include_net_worth"],
    defaultReturn: 10,
    description: "Residential or commercial property investment",
    placeholder: "e.g. Apartment in Bangalore",
    calc: ({ lumpsum, currentAmount, tenureYears, returnRate }) => {
      const principal = (lumpsum || 0) + currentAmount;
      return Math.round(lumpsumMaturity(principal, tenureYears, returnRate));
    },
  },
};

export const INVESTMENT_TYPES_LIST = Object.entries(INVESTMENT_TYPE_META).map(
  ([key, meta]) => ({ key: key as InvestmentType, ...meta })
);
