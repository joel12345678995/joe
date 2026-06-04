"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Building2,
  FileText,
  Activity,
  DollarSign,
  TrendingUp,
} from "lucide-react";

type Family = {
  id: string;
  name: string;
  description?: string;
  currency?: string;
  transparency_mode?: string;
  migration_status?: string;
  created_at: string;
};

type ActivityItem = {
  id: string;
  message: string;
  created_at: string;
};

export default function AdminPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<Family[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

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

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      // Families
      const { data: familiesData } = await supabase
        .from("families")
        .select("*")
        .order("created_at", { ascending: false });

      const familiesList = (familiesData as Family[]) || [];
      setFamilies(familiesList);

      // Counts
      const { count: familiesCount } = await supabase
        .from("families")
        .select("*", { count: "exact", head: true });

      const { count: membersCount } = await supabase
        .from("family_members")
        .select("*", { count: "exact", head: true });

      // Contributions
      const { data: contributions } = await supabase
        .from("contributions")
        .select("amount")
        .eq("status", "paid");

      let totalAmount = 0;
      if (contributions) {
        contributions.forEach((c: { amount: number | null }) => {
          totalAmount += c.amount ?? 0;
        });
      }

      // Loans
      const { data: loans } = await supabase
        .from("loans")
        .select("status");

      const activeLoans =
        loans?.filter((l: { status: string }) => l.status === "active")
          .length ?? 0;

      // Migration stats
      const { count: pending } = await supabase
        .from("migration_records")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_verification");

      const { count: completed } = await supabase
        .from("migration_records")
        .select("*", { count: "exact", head: true })
        .eq("status", "verified");

      // Activity
      const { data: activityData } = await supabase
        .from("activity_feed")
        .select("id, message, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      setActivities((activityData as ActivityItem[]) || []);

      // Final stats
      setStats({
        totalFamilies: familiesCount ?? 0,
        totalMembers: membersCount ?? 0,
        totalContributions: contributions?.length ?? 0,
        totalLoans: loans?.length ?? 0,
        pendingVerifications: pending ?? 0,
        completedMigrations: completed ?? 0,
        totalAmountCollected: totalAmount,
        activeLoans,
      });
    } catch (error) {
      console.error("Admin page error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>

      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Families</CardTitle></CardHeader>
          <CardContent>{stats.totalFamilies}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Members</CardTitle></CardHeader>
          <CardContent>{stats.totalMembers}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Loans</CardTitle></CardHeader>
          <CardContent>{stats.totalLoans}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Total Collected</CardTitle></CardHeader>
          <CardContent>
            UGX {stats.totalAmountCollected.toLocaleString()}
          </CardContent>
        </Card>
      </div>

      {/* MIDDLE */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Loan Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Active Loans: {stats.activeLoans}</p>
            <p>Pending Verifications: {stats.pendingVerifications}</p>
            <p>Completed Migrations: {stats.completedMigrations}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Total Contributions: {stats.totalContributions}</p>
            <p>Total Families: {stats.totalFamilies}</p>
          </CardContent>
        </Card>
      </div>

      {/* ACTIVITY FEED */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-gray-500">No activity yet</p>
          ) : (
            activities.map((a) => (
              <div key={a.id} className="border-b py-2">
                <p>{a.message}</p>
                <small className="text-gray-500">
                  {new Date(a.created_at).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* FAMILY LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Families</CardTitle>
        </CardHeader>
        <CardContent>
          {families.length === 0 ? (
            <p className="text-gray-500">No families found</p>
          ) : (
            families.map((f) => (
              <div key={f.id} className="border-b py-2">
                <p className="font-semibold">{f.name}</p>
                <p className="text-sm text-gray-500">
                  {f.migration_status} • {f.currency}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}