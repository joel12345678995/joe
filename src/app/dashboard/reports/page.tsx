"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportData {
  // Summary Stats
  totalMembers: number;
  totalContributions: number;
  totalAmountCollected: number;
  totalExpectedAmount: number;
  completionRate: number;
  
  // Loan Stats
  totalLoans: number;
  activeLoans: number;
  totalLoanAmount: number;
  totalRepaidAmount: number;
  defaultedLoans: number;
  
  // Member Stats
  topContributors: Array<{name: string; amount: number; streak: number}>;
  pendingVerifications: number;
  overdueContributions: number;
  
  // Monthly Data
  monthlyData: Array<{month: string; collected: number; expected: number}>;
  
  // Recent Activity
  recentActivity: Array<{date: string; action: string; member: string; amount: number}>;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    totalMembers: 0,
    totalContributions: 0,
    totalAmountCollected: 0,
    totalExpectedAmount: 0,
    completionRate: 0,
    totalLoans: 0,
    activeLoans: 0,
    totalLoanAmount: 0,
    totalRepaidAmount: 0,
    defaultedLoans: 0,
    topContributors: [],
    pendingVerifications: 0,
    overdueContributions: 0,
    monthlyData: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const [reportType, setReportType] = useState("all");
  const [userRole, setUserRole] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's role and family
      const { data: currentMember } = await supabase
        .from("family_members")
        .select("role, family_id")
        .eq("user_id", user.id)
        .single();

      if (currentMember) {
        setUserRole(currentMember.role);

        // Get all members
        const { data: members } = await supabase
          .from("family_members")
          .select("id, display_name, role, total_contributed, contribution_streak")
          .eq("family_id", currentMember.family_id)
          .eq("is_active", true);

        // Get all contributions
        let contributionsQuery = supabase
          .from("contributions")
          .select("*")
          .eq("family_id", currentMember.family_id);

        if (dateRange !== "all") {
          const months = parseInt(dateRange);
          const cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - months);
          contributionsQuery = contributionsQuery.gte("created_at", cutoffDate.toISOString());
        }

        const { data: contributions } = await contributionsQuery;

        // Get all loans
        const { data: loans } = await supabase
          .from("loans")
          .select("*")
          .eq("family_id", currentMember.family_id);

        // Get payment requests
        const { data: paymentRequests } = await supabase
          .from("payment_requests")
          .select("*")
          .eq("family_id", currentMember.family_id)
          .eq("status", "pending");

        // Calculate summary stats
        const paidContributions = contributions?.filter(c => c.status === "paid") || [];
        const pendingContributions = contributions?.filter(c => c.status === "pending") || [];
        const overdueContributions = contributions?.filter(c => c.status === "overdue") || [];
        
        const totalAmountCollected = paidContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
        const totalExpectedAmount = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
        const completionRate = totalExpectedAmount > 0 ? (totalAmountCollected / totalExpectedAmount) * 100 : 0;

        // Loan stats
        const totalLoans = loans?.length || 0;
        const activeLoans = loans?.filter(l => l.status === "active").length || 0;
        const totalLoanAmount = loans?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0;
        const totalRepaidAmount = loans?.reduce((sum, l) => sum + (l.total_repaid || 0), 0) || 0;
        const defaultedLoans = loans?.filter(l => l.status === "defaulted").length || 0;

        // Top contributors
        const topContributors = (members || [])
          .map(m => ({
            name: m.display_name || "Member",
            amount: m.total_contributed || 0,
            streak: m.contribution_streak || 0
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        // Monthly data (last 6 months)
        const monthlyData = generateMonthlyData(contributions || []);

        // Recent activity
        const recentActivity = (contributions || [])
          .filter(c => c.status === "paid")
          .slice(0, 10)
          .map(c => ({
            date: c.paid_at || c.created_at,
            action: "Contribution",
            member: "Member",
            amount: c.amount
          }));

        setReportData({
          totalMembers: members?.length || 0,
          totalContributions: contributions?.length || 0,
          totalAmountCollected,
          totalExpectedAmount,
          completionRate,
          totalLoans,
          activeLoans,
          totalLoanAmount,
          totalRepaidAmount,
          defaultedLoans,
          topContributors,
          pendingVerifications: paymentRequests?.length || 0,
          overdueContributions: overdueContributions.length,
          monthlyData,
          recentActivity
        });
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (contributions: any[]) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentDate = new Date();
    const monthlyData = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(currentDate.getMonth() - i);
      const monthName = months[monthDate.getMonth()];
      const monthYear = monthDate.getFullYear();
      
      const monthContributions = contributions.filter(c => {
        const contribDate = new Date(c.created_at);
        return contribDate.getMonth() === monthDate.getMonth() && 
               contribDate.getFullYear() === monthYear;
      });
      
      const collected = monthContributions
        .filter(c => c.status === "paid")
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      
      const expected = monthContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      monthlyData.push({
        month: `${monthName} ${monthYear}`,
        collected,
        expected
      });
    }
    
    return monthlyData;
  };

  const exportToCSV = (type: string) => {
    let headers: string[] = [];
    let rows: any[][] = [];
    
    switch (type) {
      case "contributions":
        headers = ["Date", "Member", "Amount", "Status", "Payment Method", "Transaction ID"];
        rows = [];
        break;
      case "loans":
        headers = ["Date", "Member", "Amount", "Interest", "Term", "Status", "Repaid"];
        rows = [];
        break;
      case "members":
        headers = ["Name", "Role", "Total Contributed", "Streak", "Status"];
        rows = reportData.topContributors.map(m => [
          m.name,
          "Member",
          m.amount,
          m.streak,
          "Active"
        ]);
        break;
      default:
        headers = ["Metric", "Value"];
        rows = [
          ["Total Members", reportData.totalMembers],
          ["Total Contributions", reportData.totalContributions],
          ["Total Amount Collected", reportData.totalAmountCollected],
          ["Completion Rate", `${reportData.completionRate.toFixed(1)}%`],
          ["Total Loans", reportData.totalLoans],
          ["Active Loans", reportData.activeLoans],
          ["Total Loan Amount", reportData.totalLoanAmount],
          ["Total Repaid", reportData.totalRepaidAmount]
        ];
    }
    
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isAdmin = userRole === "family_admin" || userRole === "super_admin" || userRole === "treasurer";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Only group administrators can access reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxCollected = Math.max(...reportData.monthlyData.map(d => d.collected), 1);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your savings group</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Time</option>
            <option value="3">Last 3 Months</option>
            <option value="6">Last 6 Months</option>
            <option value="12">Last Year</option>
          </select>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Reports</option>
            <option value="contributions">Contributions</option>
            <option value="loans">Loans</option>
            <option value="members">Members</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalMembers}</div>
            <p className="text-xs text-gray-500">Active members</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              UGX {reportData.totalAmountCollected.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">of UGX {reportData.totalExpectedAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reportData.completionRate.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${reportData.completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{reportData.activeLoans}</div>
            <p className="text-xs text-gray-500">UGX {reportData.totalLoanAmount.toLocaleString()} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Contribution Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.monthlyData.map((data, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{data.month}</span>
                  <span className="font-semibold">UGX {data.collected.toLocaleString()} / {data.expected.toLocaleString()}</span>
                </div>
                <div className="flex gap-1">
                  <div 
                    className="bg-green-500 h-6 rounded-l"
                    style={{ width: `${(data.collected / maxCollected) * 100}%` }}
                  />
                  <div 
                    className="bg-gray-300 h-6 rounded-r"
                    style={{ width: `${((data.expected - data.collected) / maxCollected) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 pt-3 border-t text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Collected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Analytics */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Loan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Loans:</span>
                <span className="font-semibold">{reportData.totalLoans}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Loans:</span>
                <span className="font-semibold text-blue-600">{reportData.activeLoans}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Defaulted Loans:</span>
                <span className="font-semibold text-red-600">{reportData.defaultedLoans}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">Total Loan Amount:</span>
                <span className="font-semibold">UGX {reportData.totalLoanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Repaid:</span>
                <span className="font-semibold text-green-600">UGX {reportData.totalRepaidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Outstanding:</span>
                <span className="font-semibold text-orange-600">
                  UGX {(reportData.totalLoanAmount - reportData.totalRepaidAmount).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topContributors.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${
                      index === 0 ? "text-yellow-500" :
                      index === 1 ? "text-gray-500" :
                      index === 2 ? "text-orange-500" :
                      "text-blue-500"
                    }`}>#{index + 1}</span>
                    <span>{member.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">UGX {member.amount.toLocaleString()}</span>
                    {member.streak > 0 && (
                      <p className="text-xs text-gray-500">{member.streak} week streak</p>
                    )}
                  </div>
                </div>
              ))}
              {reportData.topContributors.length === 0 && (
                <p className="text-gray-500 text-center py-4">No contributions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button
              onClick={() => exportToCSV("summary")}
              className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mb-2"></div>
              <p className="font-semibold">Summary Report</p>
              <p className="text-xs text-gray-500">Overall statistics</p>
            </button>
            <button
              onClick={() => exportToCSV("contributions")}
              className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mb-2"></div>
              <p className="font-semibold">Contributions</p>
              <p className="text-xs text-gray-500">All contribution records</p>
            </button>
            <button
              onClick={() => exportToCSV("loans")}
              className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mb-2"></div>
              <p className="font-semibold">Loans Report</p>
              <p className="text-xs text-gray-500">Loan applications & status</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}