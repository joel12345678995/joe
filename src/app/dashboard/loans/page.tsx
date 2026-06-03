"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Landmark, Plus, CheckCircle, Clock, 
  AlertTriangle, TrendingUp, DollarSign,
  Activity 
} from "lucide-react";

interface Loan {
  id: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  status: string;
  purpose: string;
  total_repaid: number;
  created_at: string;
  approved_at: string | null;
  disbursed_at: string | null;
  borrower_id: string;
  family_members?: {
    display_name: string;
    profiles?: {
      full_name: string;
      email: string;
    };
  };
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    interest_rate: "5",
    term_months: "12",
    purpose: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalLoans: 0,
    totalBorrowed: 0,
    totalRepaid: 0,
    activeLoans: 0,
    pendingApprovals: 0
  });
  const supabase = createClient();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: familyMember, error: fmError } = await supabase
        .from("family_members")
        .select("id, family_id, display_name")
        .eq("user_id", user.id)
        .single();

      if (fmError) {
        console.error("Error fetching family member:", fmError);
        setLoading(false);
        return;
      }

      if (familyMember) {
        const { data: loansData, error: loansError } = await supabase
          .from("loans")
          .select(`
            *,
            family_members:borrower_id(
              display_name,
              profiles:user_id(
                full_name,
                email
              )
            )
          `)
          .eq("family_id", familyMember.family_id)
          .order("created_at", { ascending: false });

        if (loansError) throw loansError;

        setLoans(loansData || []);

        const totalLoans = loansData?.length || 0;
        const totalBorrowed = loansData?.reduce((sum, loan) => sum + (loan.amount || 0), 0) || 0;
        const totalRepaid = loansData?.reduce((sum, loan) => sum + (loan.total_repaid || 0), 0) || 0;
        const activeLoans = loansData?.filter(l => l.status === "active").length || 0;
        const pendingApprovals = loansData?.filter(l => l.status === "pending").length || 0;

        setStats({
          totalLoans,
          totalBorrowed,
          totalRepaid,
          activeLoans,
          pendingApprovals
        });
      }
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLoan = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: familyMember, error: fmError } = await supabase
        .from("family_members")
        .select("id, family_id")
        .eq("user_id", user.id)
        .single();

      if (fmError) throw new Error("No family membership found");

      const { error } = await supabase
        .from("loans")
        .insert({
          family_id: familyMember.family_id,
          borrower_id: familyMember.id,
          amount: parseFloat(formData.amount),
          interest_rate: parseFloat(formData.interest_rate),
          term_months: parseInt(formData.term_months),
          purpose: formData.purpose,
          status: "pending"
        });

      if (error) throw error;

      setShowRequestDialog(false);
      setFormData({ amount: "", interest_rate: "5", term_months: "12", purpose: "" });
      fetchLoans();
      
      alert("Loan request submitted successfully!");
    } catch (error: any) {
      console.error("Error requesting loan:", error);
      alert(error.message || "Failed to request loan. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "active": return "bg-blue-100 text-blue-700";
      case "completed": return "bg-green-100 text-green-700";
      case "defaulted": return "bg-red-100 text-red-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const pendingLoans = loans.filter(l => l.status === "pending");
  const activeLoans = loans.filter(l => l.status === "active");
  const completedLoans = loans.filter(l => l.status === "completed");
  const defaultedLoans = loans.filter(l => l.status === "defaulted");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loans Management</h1>
          <p className="text-gray-600 mt-1">Request, track, and manage your loans</p>
        </div>
        <Button 
          onClick={() => setShowRequestDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Loan
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Loans</CardTitle>
            <Landmark className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLoans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Borrowed</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {stats.totalBorrowed.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Repaid</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {stats.totalRepaid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Loans</CardTitle>
            <Activity className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLoans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Approval</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Categories */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{pendingLoans.length}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{activeLoans.length}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{completedLoans.length}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{defaultedLoans.length}</p>
              <p className="text-sm text-gray-600">Defaulted</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Loans List */}
      <Card>
        <CardHeader>
          <CardTitle>All Loan Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loans.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No loan requests found</p>
            ) : (
              loans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-lg">UGX {loan.amount.toLocaleString()}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Term:</span>
                        <span className="ml-2 font-medium">{loan.term_months} months</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Interest:</span>
                        <span className="ml-2 font-medium">{loan.interest_rate}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Repaid:</span>
                        <span className="ml-2 font-medium">UGX {(loan.total_repaid || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Remaining:</span>
                        <span className="ml-2 font-medium">UGX {(loan.amount - (loan.total_repaid || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                    {loan.purpose && (
                      <p className="text-sm text-gray-600 mt-2">Purpose: {loan.purpose}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>Requested: {new Date(loan.created_at).toLocaleDateString()}</span>
                      {loan.approved_at && (
                        <span>Approved: {new Date(loan.approved_at).toLocaleDateString()}</span>
                      )}
                      {loan.disbursed_at && (
                        <span>Disbursed: {new Date(loan.disbursed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  {loan.status === "active" && (
                    <Button variant="outline" size="sm" className="ml-4">
                      Make Payment
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request Loan Dialog - Using native HTML elements */}
      {showRequestDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Request a Loan</h2>
                <button
                  onClick={() => setShowRequestDialog(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (UGX)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    placeholder="5"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term (Months)
                  </label>
                  <input
                    type="number"
                    placeholder="12"
                    value={formData.term_months}
                    onChange={(e) => setFormData({ ...formData, term_months: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose
                  </label>
                  <textarea
                    placeholder="Why do you need this loan?"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleRequestLoan}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}