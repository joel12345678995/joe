"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CreateLeaderPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createClient();

  const createGroupLeader = async () => {
    if (!familyName || !fullName || !email || !password) {
      setMessage("❌ Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setMessage("❌ Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Create user
      const { data: userData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: "family_admin",
            },
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      if (!userData.user) {
        throw new Error("User creation failed.");
      }

      // Create family
      const { data: family, error: familyError } = await supabase
        .from("families")
        .insert({
          name: familyName,
          slug: familyName
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-"),
          created_by: userData.user.id,
          migration_status: "draft",
        })
        .select()
        .single();

      if (familyError) {
        throw familyError;
      }

      // Add family admin
      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_id: family.id,
          user_id: userData.user.id,
          role: "family_admin",
          display_name: fullName,
          is_active: true,
        });

      if (memberError) {
        throw memberError;
      }

      setMessage(
        `✅ Success! Group leader created for "${familyName}". They can now log in and add members.`
      );

      setEmail("");
      setFullName("");
      setPassword("");
      setFamilyName("");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      setMessage(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Group Leader (Family Admin)</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Group/Family Name
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. John Family, Smith Group"
                className="w-full rounded-md border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Leader Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-md border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Leader Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="leader@example.com"
                className="w-full rounded-md border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Temporary Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-md border p-2"
              />
            </div>

            <Button
              onClick={createGroupLeader}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Group Leader"}
            </Button>

            {message && (
              <div
                className={`rounded-md p-3 ${
                  message.startsWith("✅")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}