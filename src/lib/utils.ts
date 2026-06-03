import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "UGX"): string {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "paid":
    case "approved":
    case "completed":
      return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400";
    case "pending":
      return "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400";
    case "overdue":
    case "defaulted":
    case "rejected":
      return "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400";
    default:
      return "text-slate-600 bg-slate-50 dark:bg-slate-800";
  }
}

export function calculateLoanSchedule(
  principal: number,
  annualRate: number,
  months: number
): { month: number; payment: number; principal: number; interest: number; balance: number }[] {
  const monthlyRate = annualRate / 100 / 12;
  const payment =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
  let balance = principal;

  for (let m = 1; m <= months; m++) {
    const interest = balance * monthlyRate;
    const principalPaid = payment - interest;
    balance = Math.max(0, balance - principalPaid);
    schedule.push({
      month: m,
      payment: Math.round(payment),
      principal: Math.round(principalPaid),
      interest: Math.round(interest),
      balance: Math.round(balance),
    });
  }
  return schedule;
}
