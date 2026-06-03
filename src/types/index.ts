export type UserRole =
  | "super_admin"
  | "family_admin"
  | "treasurer"
  | "secretary"
  | "auditor"
  | "member";

export type TransparencyMode = "full" | "limited" | "private";
export type ContributionStatus = "paid" | "pending" | "overdue" | "rejected";
export type LoanStatus = "pending" | "approved" | "active" | "completed" | "defaulted" | "rejected";
export type ContributionFrequency = "daily" | "weekly" | "monthly" | "emergency" | "event";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  locale: string;
  created_at: string;
}

export interface Family {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  transparency_mode: TransparencyMode;
  contribution_amount: number;
  contribution_frequency: ContributionFrequency;
  migration_status: string;
  hybrid_mode: boolean;
  logo_url: string | null;
  created_by: string | null;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: UserRole;
  display_name: string | null;
  phone: string | null;
  initial_balance: number;
  contribution_streak: number;
  total_contributed: number;
  is_active: boolean;
  joined_at: string;
  profiles?: Profile;
}

export interface PaymentAccount {
  id: string;
  family_id: string;
  account_type: string;
  account_name: string;
  account_number: string;
  bank_name: string | null;
  qr_code_url: string | null;
  is_primary: boolean;
  is_active: boolean;
}

export interface Contribution {
  id: string;
  family_id: string;
  member_id: string;
  cycle_id: string | null;
  amount: number;
  status: ContributionStatus;
  payment_reference: string | null;
  receipt_url: string | null;
  paid_at: string | null;
  due_date: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  family_members?: FamilyMember;
}

export interface Loan {
  id: string;
  family_id: string;
  borrower_id: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  status: LoanStatus;
  purpose: string | null;
  approved_by: string | null;
  total_repaid: number;
  created_at: string;
  family_members?: FamilyMember;
}

export interface Notification {
  id: string;
  user_id: string;
  family_id: string | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ActivityFeedItem {
  id: string;
  family_id: string;
  actor_id: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface MigrationRecord {
  id: string;
  family_id: string;
  method: string;
  imported_members: number;
  imported_balances: number;
  imported_loans: number;
  completeness_pct: number;
  status: string;
  verified_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalExpected: number;
  totalCollected: number;
  paidCount: number;
  unpaidCount: number;
  completionPct: number;
  overdueCount: number;
}
