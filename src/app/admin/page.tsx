"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Building2,
  FileText,
  Activity,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface ActivityProfile {
  full_name?: string;
  email?: string;
}

interface ActivityItem {
  id: string;
  message: string;
  created_at: string;
  profiles?: ActivityProfile;
}

interface Family {
  id: string;
  name: string;
  description?: string;
  currency?: string;
  transparency_mode?: string;
  migration_status?: string;
  created_at: string;
}

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);

  const [stats, setStats] = useState({
    totalFamilies: 0,
    totalMembers: 0,
    totalContributions: 0,
    totalLoans: 0,
    pendingVerifications: 0,
    completedMigrations: 0,
    totalAmountCollected: 0,
    activeLoans: 0,
  });
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);

    try {
      const familiesQuery = supabase
        .from("families")
        .select("*")
        .order("created_at", { ascending: false });

      const membersCountQuery = supabase
        .from("family_members")
        .select("*", { count: "exact", head: true });

      const contributionsQuery = supabase
        .from("contributions")
        .select("amount")
        .eq("status", "paid");

      const loansQuery = supabase.from("loans").select("status");

      const pendingCountQuery = supabase
        .from("migration_records")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_verification");

      const completedCountQuery = supabase
        .from("migration_records")
        .select("*", { count: "exact", head: true })
        .eq("status", "verified");

      const activitiesQuery = supabase
        .from("activity_feed")
        .select(`*, profiles:actor_id(full_name, email)`)
        .order("created_at", { ascending: false })
        .limit(10);

      const [
        familiesResult,
        membersCountResult,
        contributionsResult,
        loansResult,
        pendingCountResult,
        completedCountResult,
        activitiesResult,
      ] = await Promise.all([
        familiesQuery,
        membersCountQuery,
        contributionsQuery,
        loansQuery,
        pendingCountQuery,
        completedCountQuery,
        activitiesQuery,
      ]);

      if (familiesResult.error) throw familiesResult.error;
      if (membersCountResult.error) throw membersCountResult.error;
      if (contributionsResult.error) throw contributionsResult.error;
      if (loansResult.error) throw loansResult.error;
      if (pendingCountResult.error) throw pendingCountResult.error;
      if (completedCountResult.error) throw completedCountResult.error;
      if (activitiesResult.error) throw activitiesResult.error;

      const familiesData = familiesResult.data as Family[] | null;
      const contributions = contributionsResult.data as Array<{ amount: number | null }> | null;
      const loans = loansResult.data as Array<{ status: string }> | null;
      const activities = activitiesResult.data as ActivityItem[] | null;

      const totalContributionsAmount = contributions?.reduce(
        (sum, contribution) => sum + (contribution.amount ?? 0),
        0
      ) ?? 0;

      const totalContributionsCount = contributions?.length ?? 0;
      const activeLoansCount = loans?.filter((loan) => loan.status === "active").length ?? 0;

      setFamilies(familiesData ?? []);
      setStats({
        totalFamilies: familiesCountResult.count ?? 0,
        totalMembers: membersCountResult.count ?? 0,
        totalContributions: totalContributionsCount,
        totalLoans: loans?.length ?? 0,
        pendingVerifications: pendingCountResult.count ?? 0,
        completedMigrations: completedCountResult.count ?? 0,
        totalAmountCollected: totalContributionsAmount,
        activeLoans: activeLoansCount,
      });
      setRecentActivities(activities ?? []);
    } catch (error: unknown) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchAdminData();
  }, [fetchAdminData]);

  const statCards = useMemo(
    () => [
      {
        title: "Total Families",
        value: stats.totalFamilies,
        icon: Building2,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        title: "Total Members",
        value: stats.totalMembers,
        icon: Users,
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        title: "Total Collected",
        value: `UGX ${stats.totalAmountCollected.toLocaleString()}`,
        icon: DollarSign,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      {
        title: "Total Loans",
        value: stats.totalLoans,
        icon: FileText,
        color: "text-orange-600",
        bg: "bg-orange-50",
      },
      {
        title: "Active Loans",
        value: stats.activeLoans,
        icon: TrendingUp,
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
      {
        title: "Contributions",
        value: stats.totalContributions,
        icon: Activity,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
      },
    ],
    [stats]
  );

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
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
        <p className="text-gray-600 mt-1">Monitor families, platform usage, and system metrics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Migration & Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Pending Verifications</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pendingVerifications}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-sm font-medium text-green-800">Completed Migrations</p>
                  <p className="text-2xl font-bold text-green-900">{stats.completedMigrations}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Contributions</span>
                <span className="font-semibold">{stats.totalContributions}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Active Loans</span>
                <span className="font-semibold">{stats.activeLoans}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Families</span>
                <span className="font-semibold">{stats.totalFamilies}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Families</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Family Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Currency</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Transparency</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Migration Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody>
                {families.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No families registered yet
                    </td>
                  </tr>
                ) : (
                  families.map((family) => (
                    <tr key={family.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{family.name}</p>
                          {family.description && (
                            <p className="text-sm text-gray-500">{family.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{family.currency || "UGX"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          family.transparency_mode === "full" ? "bg-green-100 text-green-700" :
                          family.transparency_mode === "limited" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {family.transparency_mode || "private"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          family.migration_status === "verified" ? "bg-green-100 text-green-700" :
                          family.migration_status === "pending_verification" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {family.migration_status || "draft"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(family.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Activity className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{activity.message}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span>{new Date(activity.created_at).toLocaleString()}</span>
                      {activity.profiles && (
                        <span>By: {activity.profiles.full_name || activity.profiles.email}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
