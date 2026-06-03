"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Users, Landmark, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalContributions: 0,
    activeLoans: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();
      
      // Get user's family
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: familyMember } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .single();
      
      if (familyMember) {
        // Get members count
        const { count: membersCount } = await supabase
          .from("family_members")
          .select("*", { count: "exact", head: true })
          .eq("family_id", familyMember.family_id);
        
        // Get contributions
        const { data: contributions } = await supabase
          .from("contributions")
          .select("amount")
          .eq("family_id", familyMember.family_id)
          .eq("status", "paid");
        
        // Get active loans
        const { count: loansCount } = await supabase
          .from("loans")
          .select("*", { count: "exact", head: true })
          .eq("family_id", familyMember.family_id)
          .eq("status", "active");
        
        const totalContributions = contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
        
        setStats({
          totalMembers: membersCount || 0,
          totalContributions,
          activeLoans: loansCount || 0,
          completionRate: 85 // Example calculation
        });
      }
      
      setLoading(false);
    };
    
    fetchStats();
  }, []);

  const statCards = [
    { title: "Total Members", value: stats.totalMembers, icon: Users, color: "text-blue-600" },
    { title: "Contributions", value: `UGX ${stats.totalContributions.toLocaleString()}`, icon: Wallet, color: "text-green-600" },
    { title: "Active Loans", value: stats.activeLoans, icon: Landmark, color: "text-orange-600" },
    { title: "Completion Rate", value: `${stats.completionRate}%`, icon: TrendingUp, color: "text-purple-600" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome back to your family treasury</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}