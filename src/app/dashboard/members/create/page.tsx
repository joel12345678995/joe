"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CreateMemberPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [familyId, setFamilyId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    getFamilyAndMembers();
  }, []);

  const getFamilyAndMembers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's family
    const { data: familyMember } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();

    if (familyMember) {
      setFamilyId(familyMember.family_id);
      
      // Get existing members
      const { data: membersList } = await supabase
        .from("family_members")
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .eq("family_id", familyMember.family_id);
      
      setMembers(membersList || []);
    }
  };

  const createMember = async () => {
    if (!familyId) {
      setMessage("❌ No family found. Please contact your group leader.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    try {
      // 1. Create user account
      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: "member" }
        }
      });
      
      if (signUpError) throw signUpError;
      
      if (!userData.user) throw new Error("User creation failed");
      
      // 2. Add to family_members as regular member
      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_id: familyId,
          user_id: userData.user.id,
          role: "member",
          display_name: fullName,
          phone: phone,
          is_active: true
        });
      
      if (memberError) throw memberError;
      
      setMessage(`✅ Member "${fullName}" created successfully! They can now login with: ${email}`);
      setEmail("");
      setFullName("");
      setPhone("");
      setPassword("");
      
      // Refresh member list
      getFamilyAndMembers();
      
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Family Member</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Member full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email (Login Credential)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="member@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="+256 XXX XXX XXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Temporary Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Min 6 characters"
              />
            </div>
            <Button onClick={createMember} disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Member Account"}
            </Button>
            {message && (
              <div className={`p-3 rounded-md ${message.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List Existing Members */}
      <Card>
        <CardHeader>
          <CardTitle>Your Family Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{member.display_name || member.profiles?.full_name}</p>
                  <p className="text-sm text-gray-500">{member.profiles?.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  member.role === "family_admin" ? "bg-purple-100 text-purple-700" :
                  member.role === "treasurer" ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {member.role}
                </span>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-center text-gray-500 py-4">No members yet. Add your first member above.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}