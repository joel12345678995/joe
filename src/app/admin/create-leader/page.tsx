"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TransparencyMode = "full" | "limited" | "private";
type StatusType = "success" | "error" | "";

export default function CreateLeaderPage() {
  const supabase = useMemo(() => createClient(), []);
  const [familyName, setFamilyName] = useState("");
  const [familyDescription, setFamilyDescription] = useState("");
  const [currency, setCurrency] = useState("UGX");
  const [transparencyMode, setTransparencyMode] = useState<TransparencyMode>("full");
  const [leaderName, setLeaderName] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [leaderPassword, setLeaderPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<StatusType>("");

  const resetForm = () => {
    setFamilyName("");
    setFamilyDescription("");
    setCurrency("UGX");
    setTransparencyMode("full");
    setLeaderName("");
    setLeaderEmail("");
    setLeaderPassword("");
  };

  const createUniqueSlug = async (baseSlug: string) => {
    let slug = baseSlug;
    let index = 1;

    while (true) {
      const { count, error } = await supabase
        .from("families")
        .select("id", { count: "exact", head: true })
        .eq("slug", slug);

      if (error) {
        throw error;
      }

      if (!count) {
        return slug;
      }

      slug = `${baseSlug}-${index}`;
      index += 1;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusType("");
    setStatusMessage("");
    setLoading(true);

    if (!familyName.trim() || !leaderName.trim() || !leaderEmail.trim() || !leaderPassword.trim()) {
      setStatusType("error");
      setStatusMessage("Family name, leader name, email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const baseSlug = slugify(familyName);
      const slug = await createUniqueSlug(baseSlug);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: leaderEmail.trim(),
        password: leaderPassword,
        options: {
          data: {
            full_name: leaderName.trim(),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        throw new Error("Failed to create leader authentication user.");
      }

      const { data: currentUserData, error: currentUserError } = await supabase.auth.getUser();
      if (currentUserError) {
        throw currentUserError;
      }

      const currentUserId = currentUserData?.user?.id;
      if (!currentUserId) {
        throw new Error("Unable to determine current admin user.");
      }

      const { data: familyData, error: familyError } = await supabase
        .from("families")
        .insert([
          {
            name: familyName.trim(),
            slug,
            description: familyDescription.trim() || null,
            currency: currency.trim() || "UGX",
            transparency_mode: transparencyMode,
            created_by: currentUserId,
          },
        ])
        .select("id")
        .single();

      if (familyError || !familyData?.id) {
        throw familyError ?? new Error("Failed to create family record.");
      }

      const { error: memberError } = await supabase.from("family_members").insert([
        {
          family_id: familyData.id,
          user_id: userId,
          role: "family_admin",
          display_name: leaderName.trim(),
          initial_balance: 0,
          contribution_streak: 0,
          total_contributed: 0,
          is_active: true,
        },
      ]);

      if (memberError) {
        throw memberError;
      }

      setStatusType("success");
      setStatusMessage("Group leader created successfully.");
      resetForm();
    } catch (error: unknown) {
      console.error("Create group leader error:", error);
      setStatusType("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to create group leader. Please check your inputs and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Group Leader</h1>
        <p className="mt-1 text-gray-600">Create a Family Admin user, family record, and assign the leader to the family.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leader & Family Details</CardTitle>
        </CardHeader>
        <CardContent>
          {statusMessage ? (
            <div
              className={`mb-6 rounded-md px-4 py-3 text-sm ${
                statusType === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {statusMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Family Name</span>
                <input
                  type="text"
                  value={familyName}
                  onChange={(event) => setFamilyName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter family name"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Currency</span>
                <input
                  type="text"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="UGX"
                  required
                />
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Leader Name</span>
                <input
                  type="text"
                  value={leaderName}
                  onChange={(event) => setLeaderName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter group leader name"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Leader Email</span>
                <input
                  type="email"
                  value={leaderEmail}
                  onChange={(event) => setLeaderEmail(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="leader@example.com"
                  required
                />
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Password</span>
                <input
                  type="password"
                  value={leaderPassword}
                  onChange={(event) => setLeaderPassword(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Create a password"
                  minLength={8}
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Transparency Mode</span>
                <select
                  value={transparencyMode}
                  onChange={(event) => setTransparencyMode(event.target.value as TransparencyMode)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="full">Full</option>
                  <option value="limited">Limited</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Family Description</span>
              <textarea
                value={familyDescription}
                onChange={(event) => setFamilyDescription(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Optional family description"
                rows={4}
              />
            </label>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {loading ? "Creating..." : "Create Group Leader"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
