"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Users, Calendar } from "lucide-react";

interface Family {
  id: string;
  name: string;
  slug: string;
  migration_status: string;
  created_at: string;
  member_count: number;
}

interface FamilyResponse {
  id: string;
  name: string;
  slug: string;
  migration_status: string;
  created_at: string;
  family_members?: Array<{
    count: number;
  }>;
}

export default function ManageFamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchFamilies = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("families")
        .select(
          `
          *,
          family_members(count)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const familiesWithCount: Family[] = ((data as FamilyResponse[]) || []).map(
        (family) => ({
          id: family.id,
          name: family.name,
          slug: family.slug,
          migration_status: family.migration_status,
          created_at: family.created_at,
          member_count: family.family_members?.[0]?.count ?? 0,
        })
      );

      setFamilies(familiesWithCount);
    } catch (error: unknown) {
      console.error("Error fetching families:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchFamilies();
  }, [fetchFamilies]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
            Verified
          </span>
        );

      case "pending_verification":
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
            Pending
          </span>
        );

      default:
        return (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
            Draft
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Manage Families
        </h1>
        <p className="mt-1 text-gray-600">
          View and manage all family groups in the system
        </p>
      </div>

      <div className="grid gap-4">
        {families.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">
                No families created yet
              </p>
            </CardContent>
          </Card>
        ) : (
          families.map((family) => (
            <Card
              key={family.id}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    {family.name}
                  </CardTitle>

                  <p className="mt-1 text-sm text-gray-500">
                    Slug: {family.slug}
                  </p>
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
                    <span>
                      Created:{" "}
                      {new Date(
                        family.created_at
                      ).toLocaleDateString()}
                    </span>
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