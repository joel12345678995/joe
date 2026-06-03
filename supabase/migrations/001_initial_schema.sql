-- JoeFamily Treasury System - Full Database Schema
-- Run in Supabase SQL Editor or via supabase db push

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM (
  'super_admin', 'family_admin', 'treasurer', 'secretary', 'auditor', 'member'
);

CREATE TYPE transparency_mode AS ENUM (
  'full', 'limited', 'private'
);

CREATE TYPE contribution_frequency AS ENUM (
  'daily', 'weekly', 'monthly', 'emergency', 'event'
);

CREATE TYPE contribution_status AS ENUM (
  'paid', 'pending', 'overdue', 'rejected'
);

CREATE TYPE loan_status AS ENUM (
  'pending', 'approved', 'active', 'completed', 'defaulted', 'rejected'
);

CREATE TYPE transaction_type AS ENUM (
  'contribution', 'loan_disbursement', 'loan_repayment', 'adjustment', 'migration'
);

CREATE TYPE payment_account_type AS ENUM (
  'mtn_momo', 'airtel_money', 'bank', 'other'
);

CREATE TYPE migration_status AS ENUM (
  'draft', 'pending_verification', 'verified', 'locked'
);

CREATE TYPE notification_type AS ENUM (
  'contribution_due', 'overdue', 'loan_reminder', 'approval', 'general'
);

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Families / Groups
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'UGX',
  transparency_mode transparency_mode DEFAULT 'full',
  contribution_amount DECIMAL(15,2) DEFAULT 0,
  contribution_frequency contribution_frequency DEFAULT 'monthly',
  migration_status migration_status DEFAULT 'draft',
  migration_locked_at TIMESTAMPTZ,
  hybrid_mode BOOLEAN DEFAULT FALSE,
  logo_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_families_slug ON public.families(slug);

-- Family Members
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role DEFAULT 'member',
  display_name TEXT,
  phone TEXT,
  initial_balance DECIMAL(15,2) DEFAULT 0,
  contribution_streak INT DEFAULT 0,
  total_contributed DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

CREATE INDEX idx_family_members_family ON public.family_members(family_id);
CREATE INDEX idx_family_members_user ON public.family_members(user_id);

-- Payment Accounts (Treasurer wallets)
CREATE TABLE public.payment_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  account_type payment_account_type NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT,
  qr_code_url TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_accounts_family ON public.payment_accounts(family_id);

-- Contribution Cycles
CREATE TABLE public.contribution_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency contribution_frequency NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contribution_cycles_family ON public.contribution_cycles(family_id);

-- Contributions
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.contribution_cycles(id),
  amount DECIMAL(15,2) NOT NULL,
  status contribution_status DEFAULT 'pending',
  payment_reference TEXT,
  receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  due_date DATE,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  is_migration BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contributions_family ON public.contributions(family_id);
CREATE INDEX idx_contributions_member ON public.contributions(member_id);
CREATE INDEX idx_contributions_status ON public.contributions(status);

-- Transactions (ledger)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.family_members(id),
  contribution_id UUID REFERENCES public.contributions(id),
  loan_id UUID,
  type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  reference TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_family ON public.transactions(family_id);

-- Loans
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  term_months INT NOT NULL,
  status loan_status DEFAULT 'pending',
  purpose TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  disbursed_at TIMESTAMPTZ,
  total_repaid DECIMAL(15,2) DEFAULT 0,
  is_migration BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loans_family ON public.loans(family_id);
CREATE INDEX idx_loans_borrower ON public.loans(borrower_id);

-- Loan Guarantors
CREATE TABLE public.loan_guarantors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  guarantor_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  amount_guaranteed DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(loan_id, guarantor_id)
);

-- Loan Repayments
CREATE TABLE public.loan_repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  payment_reference TEXT,
  receipt_url TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loan_repayments_loan ON public.loan_repayments(loan_id);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_family ON public.audit_logs(family_id);

-- Activity Feed
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_family ON public.activity_feed(family_id);

-- Meetings
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  minutes_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts (community)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges / Gamification
CREATE TABLE public.member_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, badge_key)
);

-- Migration Records
CREATE TABLE public.migration_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  imported_members INT DEFAULT 0,
  imported_balances DECIMAL(15,2) DEFAULT 0,
  imported_loans DECIMAL(15,2) DEFAULT 0,
  completeness_pct DECIMAL(5,2) DEFAULT 0,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  status migration_status DEFAULT 'draft',
  audit_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK for transactions.loan_id
ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_loan
  FOREIGN KEY (loan_id) REFERENCES public.loans(id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER families_updated_at BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER contributions_updated_at BEFORE UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER loans_updated_at BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Helper: get user role in family
CREATE OR REPLACE FUNCTION public.get_family_role(p_family_id UUID, p_user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.family_members
  WHERE family_id = p_family_id AND user_id = p_user_id AND is_active = TRUE
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_family_admin(p_family_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = p_family_id AND user_id = p_user_id
    AND role IN ('family_admin', 'treasurer', 'super_admin')
    AND is_active = TRUE
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND is_super_admin = TRUE);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Activity feed trigger on contribution verify
CREATE OR REPLACE FUNCTION public.log_contribution_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    SELECT COALESCE(fm.display_name, p.full_name, 'Member') INTO v_name
    FROM public.family_members fm
    JOIN public.profiles p ON p.id = fm.user_id
    WHERE fm.id = NEW.member_id;

    INSERT INTO public.activity_feed (family_id, actor_id, message, metadata)
    VALUES (
      NEW.family_id,
      NEW.verified_by,
      v_name || ' contributed ' || NEW.amount::TEXT || ' (verified)',
      jsonb_build_object('contribution_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER contribution_activity AFTER UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.log_contribution_activity();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_records ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Members can view family member profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid() AND fm2.user_id = profiles.id
  )
);

-- Families policies
CREATE POLICY "Members can view their families" ON public.families FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.family_members WHERE family_id = families.id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = TRUE)
);
CREATE POLICY "Admins can insert families" ON public.families FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update families" ON public.families FOR UPDATE USING (
  public.is_family_admin(id, auth.uid())
);

-- Family members policies
CREATE POLICY "View family members" ON public.family_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_id = family_members.family_id AND fm.user_id = auth.uid())
);
CREATE POLICY "Admins manage members" ON public.family_members FOR ALL USING (
  public.is_family_admin(family_id, auth.uid())
);

-- Payment accounts - all members can view
CREATE POLICY "Members view payment accounts" ON public.payment_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.family_members WHERE family_id = payment_accounts.family_id AND user_id = auth.uid())
);
CREATE POLICY "Treasurer manage payment accounts" ON public.payment_accounts FOR ALL USING (
  public.is_family_admin(family_id, auth.uid())
);

-- Contributions
CREATE POLICY "Members view contributions" ON public.contributions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.family_members WHERE family_id = contributions.family_id AND user_id = auth.uid())
);
CREATE POLICY "Members insert contributions" ON public.contributions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = contributions.family_id AND fm.user_id = auth.uid() AND fm.id = contributions.member_id
  )
);
CREATE POLICY "Treasurer update contributions" ON public.contributions FOR UPDATE USING (
  public.is_family_admin(family_id, auth.uid())
);

-- Loans
CREATE POLICY "Members view loans" ON public.loans FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.family_members WHERE family_id = loans.family_id AND user_id = auth.uid())
);
CREATE POLICY "Members request loans" ON public.loans FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = loans.family_id AND fm.user_id = auth.uid() AND fm.id = loans.borrower_id
  )
);
CREATE POLICY "Admins manage loans" ON public.loans FOR UPDATE USING (
  public.is_family_admin(family_id, auth.uid())
);

-- Loan repayments & guarantors
CREATE POLICY "View loan guarantors" ON public.loan_guarantors FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.loans l JOIN public.family_members fm ON fm.family_id = l.family_id
    WHERE l.id = loan_guarantors.loan_id AND fm.user_id = auth.uid())
);
CREATE POLICY "View loan repayments" ON public.loan_repayments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.loans l JOIN public.family_members fm ON fm.family_id = l.family_id
    WHERE l.id = loan_repayments.loan_id AND fm.user_id = auth.uid())
);
CREATE POLICY "Insert loan repayments" ON public.loan_repayments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.loans l JOIN public.family_members fm ON fm.family_id = l.family_id
    WHERE l.id = loan_repayments.loan_id AND fm.user_id = auth.uid())
);
CREATE POLICY "Verify loan repayments" ON public.loan_repayments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.loans l WHERE l.id = loan_repayments.loan_id AND public.is_family_admin(l.family_id, auth.uid()))
);

-- Notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Activity feed
CREATE POLICY "Members view activity" ON public.activity_feed FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.family_members WHERE family_id = activity_feed.family_id AND user_id = auth.uid())
);
CREATE POLICY "Insert activity" ON public.activity_feed FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.family_members WHERE family_id = activity_feed.family_id AND user_id = auth.uid())
);

-- Audit logs - admins only
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT USING (
  family_id IS NULL OR public.is_family_admin(family_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = TRUE)
);
CREATE POLICY "Insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Transactions, cycles, meetings, posts, comments, badges, migration
CREATE POLICY "Members view transactions" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.family_members WHERE family_id = transactions.family_id AND user_id = auth.uid())
);
CREATE POLICY "Admins manage transactions" ON public.transactions FOR ALL USING (
  public.is_family_admin(family_id, auth.uid())
);

CREATE POLICY "Members view cycles" ON public.contribution_cycles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.family_members WHERE family_id = contribution_cycles.family_id AND user_id = auth.uid())
);
CREATE POLICY "Admins manage cycles" ON public.contribution_cycles FOR ALL USING (
  public.is_family_admin(family_id, auth.uid())
);

CREATE POLICY "Members view meetings" ON public.meetings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.family_members WHERE family_id = meetings.family_id AND user_id = auth.uid())
);
CREATE POLICY "Admins manage meetings" ON public.meetings FOR ALL USING (
  public.is_family_admin(family_id, auth.uid())
);

CREATE POLICY "Members view posts" ON public.posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.family_members WHERE family_id = posts.family_id AND user_id = auth.uid())
);
CREATE POLICY "Members create posts" ON public.posts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.family_members WHERE family_id = posts.family_id AND user_id = auth.uid())
);

CREATE POLICY "Members view comments" ON public.comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts p JOIN public.family_members fm ON fm.family_id = p.family_id
    WHERE p.id = comments.post_id AND fm.user_id = auth.uid())
);
CREATE POLICY "Members create comments" ON public.comments FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Members view badges" ON public.member_badges FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.id = member_badges.member_id
    AND EXISTS (SELECT 1 FROM public.family_members fm2 WHERE fm2.family_id = fm.family_id AND fm2.user_id = auth.uid()))
);

CREATE POLICY "Admins view migration" ON public.migration_records FOR SELECT USING (
  public.is_family_admin(family_id, auth.uid())
);
CREATE POLICY "Admins manage migration" ON public.migration_records FOR ALL USING (
  public.is_family_admin(family_id, auth.uid())
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loans;

-- Storage buckets (run separately in dashboard or):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);
