"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Wallet, TrendingUp, Calendar, CheckCircle, 
  Clock, AlertCircle, Search, Download, Users,
  Eye, ChevronDown, ChevronUp, PiggyBank
} from "lucide-react";

interface Contribution {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  due_date: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  member_id: string;
}

interface Member {
  id: string;
  display_name: string;
  role: string;
  total_contributed: number;
  contribution_streak: number;
  contributions: Contribution[];
}

export default function ContributionsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [allContributions, setAllContributions] = useState<Contribution[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"group" | "individual">("group");
  const [userRole, setUserRole] = useState("");
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalExpected: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    completionRate: 0,
    totalMembers: 0,
    averageSavings: 0,
    topSaver: "",
    topSaverAmount: 0
  });
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      const member = members.find(m => m.id === selectedMember);
      setFilteredContributions(member?.contributions || []);
    } else {
      setFilteredContributions(allContributions);
    }
  }, [selectedMember, members, allContributions]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentMember } = await supabase
        .from("family_members")
        .select("role, family_id")
        .eq("user_id", user.id)
        .single();

      if (currentMember) {
        setUserRole(currentMember.role);

        const { data: membersData } = await supabase
          .from("family_members")
          .select(`
            id,
            display_name,
            role,
            total_contributed,
            contribution_streak
          `)
          .eq("family_id", currentMember.family_id)
          .eq("is_active", true);

        const { data: contributionsData } = await supabase
          .from("contributions")
          .select(`
            *,
            member_id
          `)
          .eq("family_id", currentMember.family_id)
          .order("created_at", { ascending: false });

        const membersWithContributions = (membersData || []).map(member => ({
          ...member,
          contributions: (contributionsData || []).filter(c => c.member_id === member.id)
        }));

        setMembers(membersWithContributions);
        setAllContributions(contributionsData || []);
        setFilteredContributions(contributionsData || []);

        const paidContributions = contributionsData?.filter(c => c.status === "paid") || [];
        const pendingContributions = contributionsData?.filter(c => c.status === "pending") || [];
        const overdueContributions = contributionsData?.filter(c => c.status === "overdue") || [];
        
        const totalCollected = paidContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
        const totalExpected = contributionsData?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
        const completionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
        
        const totalSavings = membersWithContributions.reduce((sum, m) => sum + (m.total_contributed || 0), 0);
        const averageSavings = membersWithContributions.length > 0 ? totalSavings / membersWithContributions.length : 0;
        
        const topSaver = membersWithContributions.reduce((top, m) => 
          (m.total_contributed || 0) > (top.total_contributed || 0) ? m : top, 
          { display_name: "None", total_contributed: 0 }
        );

        setStats({
          totalCollected,
          totalExpected,
          paidCount: paidContributions.length,
          pendingCount: pendingContributions.length,
          overdueCount: overdueContributions.length,
          completionRate,
          totalMembers: membersWithContributions.length,
          averageSavings,
          topSaver: topSaver.display_name,
          topSaverAmount: topSaver.total_contributed || 0
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportAllReport = () => {
    const headers = ["Member", "Role", "Total Saved", "Streak", "Payments"];
    const rows = members.map(m => [
      m.display_name,
      m.role,
      m.total_contributed,
      m.contribution_streak,
      m.contributions.filter(c => c.status === "paid").length
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `savings_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      overdue: "bg-red-100 text-red-700"
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const isAdmin = userRole === "family_admin" || userRole === "super_admin" || userRole === "treasurer";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contributions & Savings</h1>
          <p className="text-gray-600 mt-1">Group overview and individual member savings tracker</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportAllReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* GROUP-LEVEL STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Group Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              UGX {stats.totalCollected.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">from {stats.totalMembers} members</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average per Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              UGX {Math.round(stats.averageSavings).toLocaleString()}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Top Saver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-700 truncate">{stats.topSaver}</div>
            <p className="text-sm font-semibold">UGX {stats.topSaverAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">⭐ Highest contributor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.paidCount} paid / {stats.pendingCount + stats.overdueCount} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* INDIVIDUAL MEMBER SAVINGS SECTION */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-green-600" />
              Individual Member Savings
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("group")}
                className={`px-3 py-1 rounded text-sm ${viewMode === "group" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
              >
                Group View
              </button>
              <button
                onClick={() => setViewMode("individual")}
                className={`px-3 py-1 rounded text-sm ${viewMode === "individual" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
              >
                Individual View
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter by Member */}
          <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedMember(null)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedMember === null 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Members ({members.length})
            </button>
            {members.map(member => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  selectedMember === member.id 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {member.display_name}
              </button>
            ))}
          </div>

          {/* Member Savings Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(selectedMember ? members.filter(m => m.id === selectedMember) : members).map((member) => (
              <div key={member.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div 
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
                  onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{member.display_name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{member.role.replace("_", " ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        UGX {member.total_contributed.toLocaleString()}
                      </p>
                      {member.contribution_streak > 0 && (
                        <p className="text-xs text-orange-600">{member.contribution_streak} week streak</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t">
                    <p className="text-sm text-gray-500">
                      {member.contributions.filter(c => c.status === "paid").length} payments
                    </p>
                    {expandedMember === member.id ? 
                      <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    }
                  </div>
                </div>
                
                {expandedMember === member.id && (
                  <div className="p-4 border-t bg-gray-50">
                    <p className="text-sm font-medium mb-2">Payment History:</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {member.contributions.length === 0 ? (
                        <p className="text-gray-500 text-center py-2 text-sm">No contributions yet</p>
                      ) : (
                        member.contributions.map((contribution) => (
                          <div key={contribution.id} className="flex justify-between items-center p-2 bg-white rounded shadow-sm">
                            <div>
                              <p className="font-medium">UGX {contribution.amount.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(contribution.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(contribution.status)}`}>
                              {contribution.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ALL CONTRIBUTIONS HISTORY */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            All Contributions History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by member or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredContributions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No contributions yet</p>
            ) : (
              filteredContributions
                .filter(c => {
                  const member = members.find(m => m.id === c.member_id);
                  return !searchTerm || 
                    member?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase());
                })
                .map((contribution) => {
                  const member = members.find(m => m.id === contribution.member_id);
                  return (
                    <div key={contribution.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{member?.display_name || "Unknown"}</p>
                        <p className="font-bold text-blue-600">UGX {contribution.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(contribution.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(contribution.status)}`}>
                          {contribution.status}
                        </span>
                        {contribution.payment_reference && (
                          <p className="text-xs text-gray-400 mt-1">Ref: {contribution.payment_reference}</p>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">✅ Paid - Contribution completed and verified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">⏳ Pending - Awaiting verification</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">⚠️ Overdue - Past due date</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}