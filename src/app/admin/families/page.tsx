"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  const supabase = useMemo(() => createClient(), []);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchFamilies = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("families")
        .select(`*, family_members(count)`) 
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

  const openEditModal = (family: Family) => {
    setEditingFamily(family);
    setEditForm({ name: family.name, slug: family.slug });
    setStatusMessage(null);
  };

  const closeEditModal = () => {
    setEditingFamily(null);
    setEditForm({ name: "", slug: "" });
  };

  const updateFamily = async () => {
    if (!editingFamily) return;
    setEditLoading(true);

    try {
      const { error } = await supabase
        .from("families")
        .update({
          name: editForm.name.trim(),
          slug: editForm.slug.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingFamily.id);

      if (error) {
        throw error;
      }

      setStatusMessage({
        type: "success",
        text: "Group updated successfully.",
      });
      await fetchFamilies();
      closeEditModal();
    } catch (error: unknown) {
      console.error("Error updating family:", error);
      setStatusMessage({
        type: "error",
        text: "Unable to update group. Please try again.",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const deleteFamily = async (familyId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this group? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeleteLoading(familyId);

    try {
      const { error } = await supabase.from("families").delete().eq("id", familyId);

      if (error) {
        throw error;
      }

      setStatusMessage({
        type: "success",
        text: "Group deleted successfully.",
      });
      await fetchFamilies();
    } catch (error: unknown) {
      console.error("Error deleting family:", error);
      setStatusMessage({
        type: "error",
        text: "Unable to delete group. Please try again.",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Families</h1>
        <p className="mt-1 text-gray-600">View and manage all family groups in the system</p>
      </div>

      {statusMessage && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="grid gap-4">
        {families.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">No families created yet</p>
            </CardContent>
          </Card>
        ) : (
          families.map((family) => (
            <Card key={family.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    {family.name}
                  </CardTitle>
                  <p className="mt-1 text-sm text-gray-500">Slug: {family.slug}</p>
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

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => openEditModal(family)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteFamily(family.id)}
                    disabled={deleteLoading === family.id}
                    className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleteLoading === family.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {editingFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Edit Group</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update the group name and slug for this family.
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Group Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Group Slug</label>
                <input
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={updateFamily}
                disabled={editLoading || !editForm.name.trim() || !editForm.slug.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editLoading ? "Saving…" : "Save changes"}
              </button>
              <button
                onClick={closeEditModal}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
