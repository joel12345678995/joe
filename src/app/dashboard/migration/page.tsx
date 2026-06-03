"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MigrationRecord {
  id: string;
  method: string;
  imported_members: number;
  imported_balances: number;
  imported_loans: number;
  completeness_pct: number;
  status: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

interface CSVRow {
  name: string;
  email: string;
  phone: string;
  initial_balance: number;
  role: string;
}

export default function MigrationPage() {
  const [activeTab, setActiveTab] = useState("methods");
  const [migrationRecords, setMigrationRecords] = useState<MigrationRecord[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [userRole, setUserRole] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [manualMembers, setManualMembers] = useState<CSVRow[]>([
    { name: "", email: "", phone: "", initial_balance: 0, role: "member" }
  ]);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    groupName: "",
    defaultContribution: 50000,
    frequency: "monthly",
    members: [] as CSVRow[]
  });
  const supabase = createClient();

  useEffect(() => {
    fetchMigrationData();
  }, []);

  const fetchMigrationData = async () => {
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
        setFamilyId(currentMember.family_id);

        const { data: records } = await supabase
          .from("migration_records")
          .select("*")
          .eq("family_id", currentMember.family_id)
          .order("created_at", { ascending: false });

        setMigrationRecords(records || []);
      }
    } catch (error) {
      console.error("Error fetching migration data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split("\n");
      const headers = rows[0].split(",").map(h => h.trim().toLowerCase());
      
      const parsedData: CSVRow[] = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const values = rows[i].split(",");
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim();
        });
        
        parsedData.push({
          name: row.name || row.full_name || "",
          email: row.email || "",
          phone: row.phone || "",
          initial_balance: parseFloat(row.initial_balance || row.balance || 0),
          role: row.role || "member"
        });
      }
      setCsvData(parsedData);
      setMessage(`✅ Loaded ${parsedData.length} members from CSV`);
    };
    reader.readAsText(file);
  };

  const importCSV = async () => {
    if (csvData.length === 0) {
      setMessage("❌ No data to import. Please upload a CSV file first.");
      return;
    }

    setImporting(true);
    setMessage("Importing members...");

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const member of csvData) {
        if (!member.email || !member.name) {
          errorCount++;
          continue;
        }

        const tempPassword = Math.random().toString(36).slice(-8);
        
        const { data: userData, error: signUpError } = await supabase.auth.signUp({
          email: member.email,
          password: tempPassword,
          options: {
            data: { 
              full_name: member.name,
              role: member.role
            }
          }
        });

        if (signUpError) {
          errorCount++;
          continue;
        }

        if (userData.user) {
          const { error: memberError } = await supabase
            .from("family_members")
            .insert({
              family_id: familyId,
              user_id: userData.user.id,
              role: member.role,
              display_name: member.name,
              phone: member.phone,
              initial_balance: member.initial_balance,
              total_contributed: member.initial_balance,
              is_active: true
            });

          if (memberError) {
            errorCount++;
          } else {
            successCount++;
          }
        }
      }

      await supabase.from("migration_records").insert({
        family_id: familyId,
        method: "csv",
        imported_members: successCount,
        imported_balances: csvData.reduce((sum, m) => sum + m.initial_balance, 0),
        completeness_pct: csvData.length > 0 ? (successCount / csvData.length) * 100 : 0,
        status: "pending_verification"
      });

      setMessage(`✅ Import complete! ${successCount} members added, ${errorCount} errors.`);
      setCsvData([]);
      setCsvFile(null);
      fetchMigrationData();
      
    } catch (error: any) {
      setMessage(`❌ Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const addManualMember = () => {
    setManualMembers([...manualMembers, { name: "", email: "", phone: "", initial_balance: 0, role: "member" }]);
  };

  // FIXED: Corrected updateManualMember function
  const updateManualMember = (index: number, field: keyof CSVRow, value: any) => {
    const updated = [...manualMembers];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      setManualMembers(updated);
    }
  };

  const removeManualMember = (index: number) => {
    const updated = [...manualMembers];
    updated.splice(index, 1);
    setManualMembers(updated);
  };

  const importManual = async () => {
    const validMembers = manualMembers.filter(m => m.name && m.email);
    if (validMembers.length === 0) {
      setMessage("❌ Please add at least one valid member");
      return;
    }

    setImporting(true);
    setMessage(`Importing ${validMembers.length} members...`);

    try {
      let successCount = 0;

      for (const member of validMembers) {
        const tempPassword = Math.random().toString(36).slice(-8);
        
        const { data: userData, error: signUpError } = await supabase.auth.signUp({
          email: member.email,
          password: tempPassword,
          options: {
            data: { full_name: member.name, role: member.role }
          }
        });

        if (!signUpError && userData.user) {
          await supabase.from("family_members").insert({
            family_id: familyId,
            user_id: userData.user.id,
            role: member.role,
            display_name: member.name,
            phone: member.phone,
            initial_balance: member.initial_balance,
            total_contributed: member.initial_balance,
            is_active: true
          });
          successCount++;
        }
      }

      await supabase.from("migration_records").insert({
        family_id: familyId,
        method: "manual",
        imported_members: successCount,
        completeness_pct: 100,
        status: "pending_verification"
      });

      setMessage(`✅ Added ${successCount} members successfully!`);
      setManualMembers([{ name: "", email: "", phone: "", initial_balance: 0, role: "member" }]);
      fetchMigrationData();
      
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const startGuidedWizard = () => {
    setWizardStep(1);
    setActiveTab("wizard");
  };

  const completeGuidedWizard = async () => {
    setImporting(true);
    try {
      await supabase
        .from("families")
        .update({
          name: wizardData.groupName,
          contribution_amount: wizardData.defaultContribution,
          contribution_frequency: wizardData.frequency,
          migration_status: "pending_verification"
        })
        .eq("id", familyId);

      let successCount = 0;
      for (const member of wizardData.members) {
        if (!member.name || !member.email) continue;
        
        const tempPassword = Math.random().toString(36).slice(-8);
        const { data: userData } = await supabase.auth.signUp({
          email: member.email,
          password: tempPassword,
          options: { data: { full_name: member.name, role: member.role } }
        });

        if (userData?.user) {
          await supabase.from("family_members").insert({
            family_id: familyId,
            user_id: userData.user.id,
            role: member.role,
            display_name: member.name,
            phone: member.phone,
            initial_balance: member.initial_balance,
            is_active: true
          });
          successCount++;
        }
      }

      await supabase.from("migration_records").insert({
        family_id: familyId,
        method: "guided",
        imported_members: successCount,
        status: "pending_verification"
      });

      setMessage(`✅ Guided migration complete! ${successCount} members added.`);
      setActiveTab("methods");
      fetchMigrationData();
      
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const isAdmin = userRole === "family_admin" || userRole === "super_admin";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Only group administrators can access migration tools.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Data Migration</h1>
      <p className="text-gray-600 mb-6">Import members, balances, and loan data into your group</p>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b flex-wrap">
        <button
          onClick={() => setActiveTab("methods")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "methods" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Migration Methods
        </button>
        <button
          onClick={() => setActiveTab("csv")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "csv" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          CSV Import
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "manual" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Manual Entry
        </button>
        <button
          onClick={startGuidedWizard}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "wizard" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Guided Wizard
        </button>
      </div>

      {/* Manual Entry Tab - with fixed update function */}
      {activeTab === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle>Manual Member Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {manualMembers.map((member, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={member.name}
                      onChange={(e) => updateManualMember(index, "name", e.target.value)}
                      className="p-2 border rounded-md"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={member.email}
                      onChange={(e) => updateManualMember(index, "email", e.target.value)}
                      className="p-2 border rounded-md"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={member.phone}
                      onChange={(e) => updateManualMember(index, "phone", e.target.value)}
                      className="p-2 border rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="Initial Balance"
                      value={member.initial_balance}
                      onChange={(e) => updateManualMember(index, "initial_balance", parseFloat(e.target.value))}
                      className="p-2 border rounded-md"
                    />
                    <div className="flex gap-2">
                      <select
                        value={member.role}
                        onChange={(e) => updateManualMember(index, "role", e.target.value)}
                        className="flex-1 p-2 border rounded-md"
                      >
                        <option value="member">Member</option>
                        <option value="treasurer">Treasurer</option>
                        <option value="secretary">Secretary</option>
                        <option value="auditor">Auditor</option>
                      </select>
                      {manualMembers.length > 1 && (
                        <button
                          onClick={() => removeManualMember(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          ✗
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addManualMember}
                className="w-full border-2 border-dashed border-gray-300 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                + Add Another Member
              </button>

              <button
                onClick={importManual}
                disabled={importing}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {importing ? "Importing..." : `Import ${manualMembers.filter(m => m.name && m.email).length} Members`}
              </button>

              {message && (
                <div className={`p-3 rounded-md ${message.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rest of the tabs remain the same... */}
      {/* CSV Import Tab */}
      {activeTab === "csv" && (
        <Card>
          <CardHeader>
            <CardTitle>CSV File Import</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  id="csvUpload"
                />
                <label htmlFor="csvUpload" className="cursor-pointer block">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="font-medium">Click to upload CSV file</p>
                  <p className="text-sm text-gray-500">Format: name, email, phone, initial_balance, role</p>
                </label>
              </div>

              {csvFile && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p>✅ File loaded: {csvFile.name}</p>
                  <p className="text-sm">{csvData.length} members found</p>
                </div>
              )}

              {csvData.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Phone</th>
                        <th className="p-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{row.name}</td>
                          <td className="p-2">{row.email}</td>
                          <td className="p-2">{row.phone}</td>
                          <td className="p-2 text-right">UGX {row.initial_balance.toLocaleString()}</td>
                        </tr>
                      ))}
                      {csvData.length > 5 && (
                        <tr><td colSpan={4} className="p-2 text-center text-gray-500">+{csvData.length - 5} more</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                onClick={importCSV}
                disabled={importing || csvData.length === 0}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? "Importing..." : `Import ${csvData.length} Members`}
              </button>

              {message && (
                <div className={`p-3 rounded-md ${message.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Methods Tab */}
      {activeTab === "methods" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>📂 CSV / Excel Import</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Upload a CSV file with member data. Format: name, email, phone, initial_balance, role
              </p>
              <button
                onClick={() => setActiveTab("csv")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Start CSV Import
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>✏️ Manual Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Add members one by one manually through a simple form.
              </p>
              <button
                onClick={() => setActiveTab("manual")}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Start Manual Entry
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guided Migration Wizard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Step-by-step wizard to set up your group and import members.
              </p>
              <button
                onClick={startGuidedWizard}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Launch Wizard
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Migration History</CardTitle>
            </CardHeader>
            <CardContent>
              {migrationRecords.length === 0 ? (
                <p className="text-sm text-gray-500">No migrations yet</p>
              ) : (
                <div className="space-y-2">
                  {migrationRecords.map((record) => (
                    <div key={record.id} className="border-b pb-2">
                      <div className="flex justify-between">
                        <span className="font-medium capitalize">{record.method}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          record.status === "verified" ? "bg-green-100 text-green-700" :
                          record.status === "pending_verification" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>{record.status}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {record.imported_members} members • {record.completeness_pct}% complete
                      </p>
                      <p className="text-xs text-gray-400">{new Date(record.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Guided Wizard Tab */}
      {activeTab === "wizard" && (
        <Card>
          <CardHeader>
            <CardTitle>Guided Migration Wizard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="text-center flex-1">
                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                      wizardStep >= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}>{step}</div>
                    <p className="text-xs mt-1">
                      {step === 1 ? "Group Setup" : step === 2 ? "Member Data" : "Confirm"}
                    </p>
                  </div>
                ))}
              </div>

              {wizardStep === 1 && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Group/Family Name"
                    value={wizardData.groupName}
                    onChange={(e) => setWizardData({...wizardData, groupName: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  />
                  <input
                    type="number"
                    placeholder="Default Contribution Amount (UGX)"
                    value={wizardData.defaultContribution}
                    onChange={(e) => setWizardData({...wizardData, defaultContribution: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded-md"
                  />
                  <select
                    value={wizardData.frequency}
                    onChange={(e) => setWizardData({...wizardData, frequency: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <button
                    onClick={() => setWizardStep(2)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg"
                  >
                    Next: Add Members
                  </button>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Add your group members</p>
                  
                  {wizardData.members.map((member, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={member.name}
                          onChange={(e) => {
                            const updated = [...wizardData.members];
                            updated[index] = { ...updated[index], name: e.target.value };
                            setWizardData({...wizardData, members: updated});
                          }}
                          className="p-2 border rounded-md"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={member.email}
                          onChange={(e) => {
                            const updated = [...wizardData.members];
                            updated[index] = { ...updated[index], email: e.target.value };
                            setWizardData({...wizardData, members: updated});
                          }}
                          className="p-2 border rounded-md"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      setWizardData({
                        ...wizardData,
                        members: [...wizardData.members, { name: "", email: "", phone: "", initial_balance: 0, role: "member" }]
                      });
                    }}
                    className="w-full border-2 border-dashed py-2 rounded-lg"
                  >
                    + Add Member
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="flex-1 bg-gray-300 py-2 rounded-lg"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setWizardStep(3)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
                    >
                      Next: Review
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p><strong>Group:</strong> {wizardData.groupName}</p>
                    <p><strong>Contribution:</strong> UGX {wizardData.defaultContribution.toLocaleString()} ({wizardData.frequency})</p>
                    <p><strong>Members:</strong> {wizardData.members.filter(m => m.name && m.email).length}</p>
                  </div>

                  <button
                    onClick={completeGuidedWizard}
                    disabled={importing}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    {importing ? "Processing..." : "Complete Migration"}
                  </button>

                  <button
                    onClick={() => setWizardStep(2)}
                    className="w-full bg-gray-300 py-2 rounded-lg"
                  >
                    Back
                  </button>
                </div>
              )}

              {message && (
                <div className={`p-3 rounded-md ${message.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}