"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Calendar, CheckCircle, XCircle } from "lucide-react";

interface Family {
  id: string;
  name: string;
  slug: string;
  migration_status: string;
  created_at: string;
  member_count: number;
}

export default function ManageFamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("families")
        .select(`
          *,
          family_members(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const familiesWithCount = (data || []).map((family: any) => ({
        ...family,
        member_count: family.family_members?.[0]?.count || 0
      }));

      setFamilies(familiesWithCount);
    } catch (error) {
      console.error("Error fetching families:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Verified</span>;
      case "pending_verification":
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Pending</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">Draft</span>;
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Manage Families</h1>
        <p className="text-gray-600 mt-1">View and manage all family groups in the system</p>
      </div>

      <div className="grid gap-4">
        {families.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">No families created yet</p>
            </CardContent>
          </Card>
        ) : (
          families.map((family) => (
            <Card key={family.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    {family.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Slug: {family.slug}</p>
                </div>
                {getStatusBadge(family.migration_status)}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{family.member_count} Members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Created: {new Date(family.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}