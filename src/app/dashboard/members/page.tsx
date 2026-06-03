"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  display_name: string;
  role: string;
  phone: string | null;
  total_contributed: number;
  contribution_streak: number;
  joined_at: string;
  is_active: boolean;
  user_id: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    display_name: "",
    phone: "",
    role: ""
  });
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    email: "",
    fullName: "",
    password: "",
    phone: "",
    role: "member"
  });
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentMember } = await supabase
        .from("family_members")
        .select("role, family_id")
        .eq("user_id", user.id)
        .single();

      if (currentMember) {
        setUserRole(currentMember.role);

        const { data: membersData } = await supabase
          .from("family_members")
          .select(`
            *,
            profiles:user_id(full_name, email)
          `)
          .eq("family_id", currentMember.family_id)
          .eq("is_active", true);

        setMembers(membersData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMember = async () => {
    try {
      const { error } = await supabase
        .from("family_members")
        .update({
          display_name: editForm.display_name,
          phone: editForm.phone,
          role: editForm.role
        })
        .eq("id", editingMember.id);

      if (error) throw error;

      alert("✅ Member updated successfully!");
      setEditingMember(null);
      fetchData();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    try {
      const { error } = await supabase
        .from("family_members")
        .update({ is_active: false })
        .eq("id", memberId);
      
      if (error) throw error;
      
      alert("✅ Member removed successfully!");
      fetchData();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const addMember = async () => {
    if (!newMember.email || !newMember.password || !newMember.fullName) {
      alert("Please fill all required fields");
      return;
    }
    
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: currentMember } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .single();

      if (!currentMember) throw new Error("No family found");

      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email: newMember.email,
        password: newMember.password,
        options: {
          data: { 
            full_name: newMember.fullName,
            role: newMember.role
          }
        }
      });

      if (signUpError) throw signUpError;

      if (userData.user) {
        const { error: memberError } = await supabase
          .from("family_members")
          .insert({
            family_id: currentMember.family_id,
            user_id: userData.user.id,
            role: newMember.role,
            display_name: newMember.fullName,
            phone: newMember.phone,
            is_active: true
          });

        if (memberError) throw memberError;
      }

      setShowAddMemberModal(false);
      setNewMember({ email: "", fullName: "", password: "", phone: "", role: "member" });
      fetchData();
      alert("✅ Member added successfully!");

    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = userRole === "family_admin" || userRole === "super_admin";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Members</h1>
          <p className="text-gray-600 mt-1">Manage your family members and their roles</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Member
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No members found</p>
            ) : (
              members.map((m) => (
                <div key={m.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {(m.display_name || m.profiles?.full_name || "M").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{m.display_name || m.profiles?.full_name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            m.role === "family_admin" ? "bg-purple-100 text-purple-700" :
                            m.role === "treasurer" ? "bg-green-100 text-green-700" :
                            m.role === "secretary" ? "bg-blue-100 text-blue-700" :
                            m.role === "auditor" ? "bg-orange-100 text-orange-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {m.role?.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{m.profiles?.email}</p>
                        {m.phone && <p className="text-xs text-gray-400">{m.phone}</p>}
                      </div>
                    </div>
                    
                    {isAdmin && m.role !== "family_admin" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingMember(m);
                            setEditForm({
                              display_name: m.display_name || m.profiles?.full_name || "",
                              phone: m.phone || "",
                              role: m.role
                            });
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteMember(m.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Contributed:</span>
                      <span className="font-semibold text-green-600">UGX {m.total_contributed?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Contribution Streak:</span>
                      <span className="font-semibold">{m.contribution_streak || 0} weeks</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Member</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({...editForm, display_name: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="member">Member</option>
                  <option value="treasurer">Treasurer</option>
                  <option value="secretary">Secretary</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={updateMember}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingMember(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Member</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={newMember.fullName}
                onChange={(e) => setNewMember({...newMember, fullName: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="email"
                placeholder="Email *"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newMember.phone}
                onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="password"
                placeholder="Temporary Password *"
                value={newMember.password}
                onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
              <select
                value={newMember.role}
                onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="member">Member</option>
                <option value="treasurer">Treasurer</option>
                <option value="secretary">Secretary</option>
                <option value="auditor">Auditor</option>
              </select>
              <button
                onClick={addMember}
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                {submitting ? "Adding..." : "Add Member"}
              </button>
            </div>
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="mt-3 w-full text-gray-500 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}