export const ROLES = {
  SUPER_ADMIN: "super_admin",
  FAMILY_ADMIN: "family_admin",
  TREASURER: "treasurer",
  SECRETARY: "secretary",
  AUDITOR: "auditor",
  MEMBER: "member",
} as const;

export const ADMIN_ROLES = ["super_admin", "family_admin", "treasurer"] as const;

export const TRANSPARENCY_MODES = {
  FULL: "full",
  LIMITED: "limited",
  PRIVATE: "private",
} as const;

export const CONTRIBUTION_FREQUENCIES = [
  { value: "daily", label: "Daily Savings" },
  { value: "weekly", label: "Weekly Savings" },
  { value: "monthly", label: "Monthly Savings" },
  { value: "emergency", label: "Emergency Fund" },
  { value: "event", label: "Event Contribution" },
] as const;

export const PAYMENT_ACCOUNT_TYPES = [
  { value: "mtn_momo", label: "MTN Mobile Money" },
  { value: "airtel_money", label: "Airtel Money" },
  { value: "bank", label: "Bank Account" },
  { value: "other", label: "Other" },
] as const;

export const BADGES = [
  { key: "first_contribution", name: "First Step", description: "Made first contribution" },
  { key: "streak_4", name: "Consistent Saver", description: "4-week contribution streak" },
  { key: "streak_12", name: "Dedicated Member", description: "12-week streak" },
  { key: "top_contributor", name: "Top Contributor", description: "Top 3 contributor this month" },
  { key: "loan_repaid", name: "Trusted Borrower", description: "Fully repaid a loan" },
] as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "LayoutDashboard" },
  { href: "/dashboard/contributions", label: "Contributions", icon: "Wallet" },
  { href: "/dashboard/transparency", label: "Transparency", icon: "Eye" },
  { href: "/dashboard/loans", label: "Loans", icon: "Landmark" },
  { href: "/dashboard/members", label: "Members", icon: "Users" },
  { href: "/dashboard/reports", label: "Reports", icon: "BarChart3" },
  { href: "/dashboard/migration", label: "Migration", icon: "Upload" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "Bell" },
  { href: "/dashboard/settings", label: "Settings", icon: "Settings" },
] as const;
