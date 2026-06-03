"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Contribution {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  due_date: string | null;
  member_name: string;
  member_role: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
  total_contributed: number;
  contribution_streak: number;
  last_payment_date: string | null;
}

interface TransparencyData {
  totalCollected: number;
  totalExpected: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  completionRate: number;
  recentContributions: Contribution[];
  memberContributions: Member[];
  transparencyMode: string;
}

export default function TransparencyPage() {
  const [data, setData] = useState<TransparencyData>({
    totalCollected: 0,
    totalExpected: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    completionRate: 0,
    recentContributions: [],
    memberContributions: [],
    transparencyMode: "full"
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchTransparencyData();
  }, []);

  const fetchTransparencyData = async () => {
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
        
        // Get family transparency settings
        const { data: family } = await supabase
          .from("families")
          .select("transparency_mode, name")
          .eq("id", currentMember.family_id)
          .single();

        const transparencyMode = family?.transparency_mode || "full";
        setData(prev => ({ ...prev, transparencyMode }));

        // Get all contributions for this family
        const { data: contributions } = await supabase
          .from("contributions")
          .select(`
            *,
            member:member_id(
              id,
              display_name,
              role
            )
          `)
          .eq("family_id", currentMember.family_id)
          .order("created_at", { ascending: false });

        // Get all members with their contribution totals
        const { data: members } = await supabase
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

        // Calculate statistics
        const paidContributions = contributions?.filter(c => c.status === "paid") || [];
        const pendingContributions = contributions?.filter(c => c.status === "pending") || [];
        const overdueContributions = contributions?.filter(c => c.status === "overdue") || [];
        
        const totalCollected = paidContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
        const totalExpected = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
        const completionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

        // Format recent contributions
        const recentContributions = (contributions || []).slice(0, 20).map(c => ({
          id: c.id,
          amount: c.amount,
          status: c.status,
          paid_at: c.paid_at,
          due_date: c.due_date,
          member_name: c.member?.display_name || "Member",
          member_role: c.member?.role || "member"
        }));

        // Format member contributions - FIXED HERE
        const memberContributions = (members || []).map(m => ({
          id: m.id,
          name: m.display_name || "Member",
          role: m.role,
          total_contributed: m.total_contributed || 0,
          contribution_streak: m.contribution_streak || 0,
          last_payment_date: null
        })).sort((a, b) => b.total_contributed - a.total_contributed);

        setData({
          totalCollected,
          totalExpected,
          paidCount: paidContributions.length,
          pendingCount: pendingContributions.length,
          overdueCount: overdueContributions.length,
          completionRate,
          recentContributions,
          memberContributions,
          transparencyMode
        });
      }
    } catch (error) {
      console.error("Error fetching transparency data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "overdue": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid": return "Paid ✓";
      case "pending": return "Pending ⏳";
      case "overdue": return "Overdue ⚠️";
      default: return status;
    }
  };

  const isAdmin = userRole === "family_admin" || userRole === "super_admin" || userRole === "treasurer";
  const canSeeFullDetails = data.transparencyMode === "full" || isAdmin;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Transparency Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Real-time visibility into group contributions and member performance
        {data.transparencyMode === "limited" && !isAdmin && " (Limited View - You can only see aggregated data)"}
        {data.transparencyMode === "private" && !isAdmin && " (Private View - Contact admin for details)"}
      </p>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              UGX {data.totalCollected.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">of UGX {data.totalExpected.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.completionRate.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${data.completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.paidCount}</div>
            <p className="text-xs text-gray-500">Contributions completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending & Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data.pendingCount + data.overdueCount}</div>
            <div className="flex gap-2 text-xs">
              <span className="text-yellow-600">Pending: {data.pendingCount}</span>
              <span className="text-red-600">Overdue: {data.overdueCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Contributions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentContributions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No contributions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-3">Member</th>
                    <th className="text-right py-2 px-3">Amount</th>
                    <th className="text-center py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentContributions.map((contribution) => (
                    <tr key={contribution.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">
                        {canSeeFullDetails ? contribution.member_name : "Member"}
                        {contribution.member_role !== "member" && canSeeFullDetails && (
                          <span className="text-xs text-gray-400 ml-1">({contribution.member_role})</span>
                        )}
                      </td>
                      <td className="text-right py-2 px-3 font-semibold">
                        UGX {contribution.amount.toLocaleString()}
                      </td>
                      <td className="text-center py-2 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(contribution.status)}`}>
                          {getStatusText(contribution.status)}
                        </span>
                      </td>
                      <td className="text-left py-2 px-3 text-sm text-gray-500">
                        {contribution.paid_at 
                          ? new Date(contribution.paid_at).toLocaleDateString()
                          : contribution.due_date 
                            ? `Due: ${new Date(contribution.due_date).toLocaleDateString()}`
                            : "-"}
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Contributions Ranking */}
      {(canSeeFullDetails || isAdmin) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Member Contribution Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            {data.memberContributions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No members found</p>
            ) : (
              <div className="space-y-3">
                {data.memberContributions.map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? "bg-yellow-500" :
                        index === 1 ? "bg-gray-400" :
                        index === 2 ? "bg-orange-500" :
                        "bg-blue-500"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{member.role.replace("_", " ")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">UGX {member.total_contributed.toLocaleString()}</p>
                      {member.contribution_streak > 0 && (
                        <p className="text-xs text-gray-500">{member.contribution_streak} week streak</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Paid - Contribution completed and verified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">Pending - Awaiting verification</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Overdue - Past due date</span>
            </div>
          </div>
          {!canSeeFullDetails && data.transparencyMode !== "full" && (
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
              ℹ️ Your group is in {data.transparencyMode} mode. Contact your admin for more details.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}