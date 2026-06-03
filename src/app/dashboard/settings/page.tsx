"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [message, setMessage] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [settings, setSettings] = useState({
    // General Settings
    familyName: "",
    description: "",
    currency: "UGX",
    
    // Loan Settings
    loansEnabled: true,
    defaultInterestRate: 5,
    maxLoanAmount: 0,
    minLoanAmount: 0,
    
    // Contribution Settings
    contributionAmount: 0,
    contributionFrequency: "monthly",
    allowPartialPayments: false,
    
    // Transparency Settings
    transparencyMode: "full",
    showMemberBalances: true,
    showContributionHistory: true,
    
    // Payment Settings
    paymentAccounts: [] as any[],
    requirePaymentProof: true,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    
    // Migration Settings
    migrationStatus: "draft"
  });
  
  const [newPaymentAccount, setNewPaymentAccount] = useState({
    account_type: "mtn_momo",
    account_name: "",
    account_number: "",
    bank_name: ""
  });
  const [showAddAccount, setShowAddAccount] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's role and family
      const { data: currentMember } = await supabase
        .from("family_members")
        .select("role, family_id")
        .eq("user_id", user.id)
        .single();

      if (currentMember) {
        setUserRole(currentMember.role);
        setFamilyId(currentMember.family_id);

        // Get family settings
        const { data: family } = await supabase
          .from("families")
          .select("*")
          .eq("id", currentMember.family_id)
          .single();

        if (family) {
          setSettings(prev => ({
            ...prev,
            familyName: family.name || "",
            description: family.description || "",
            currency: family.currency || "UGX",
            contributionAmount: family.contribution_amount || 0,
            contributionFrequency: family.contribution_frequency || "monthly",
            transparencyMode: family.transparency_mode || "full",
            migrationStatus: family.migration_status || "draft",
            loansEnabled: family.loans_enabled !== undefined ? family.loans_enabled : true
          }));
        }

        // Get payment accounts
        const { data: accounts } = await supabase
          .from("payment_accounts")
          .select("*")
          .eq("family_id", currentMember.family_id)
          .eq("is_active", true);

        if (accounts) {
          setSettings(prev => ({ ...prev, paymentAccounts: accounts }));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    
    try {
      // Update family settings
      const { error: familyError } = await supabase
        .from("families")
        .update({
          name: settings.familyName,
          description: settings.description,
          currency: settings.currency,
          contribution_amount: settings.contributionAmount,
          contribution_frequency: settings.contributionFrequency,
          transparency_mode: settings.transparencyMode,
          loans_enabled: settings.loansEnabled
        })
        .eq("id", familyId);

      if (familyError) throw familyError;

      setMessage("✅ Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
      
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const addPaymentAccount = async () => {
    if (!newPaymentAccount.account_name || !newPaymentAccount.account_number) {
      alert("Please fill account name and number");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("payment_accounts")
        .insert({
          family_id: familyId,
          account_type: newPaymentAccount.account_type,
          account_name: newPaymentAccount.account_name,
          account_number: newPaymentAccount.account_number,
          bank_name: newPaymentAccount.bank_name || null,
          is_active: true
        });

      if (error) throw error;

      alert("✅ Payment account added!");
      setShowAddAccount(false);
      setNewPaymentAccount({
        account_type: "mtn_momo",
        account_name: "",
        account_number: "",
        bank_name: ""
      });
      fetchSettings();
      
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const deletePaymentAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this payment account?")) return;
    
    try {
      const { error } = await supabase
        .from("payment_accounts")
        .update({ is_active: false })
        .eq("id", accountId);

      if (error) throw error;

      alert("✅ Account deleted!");
      fetchSettings();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
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
            <p className="text-red-600">Only group administrators can access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Group Settings</h1>
      <p className="text-gray-600 mb-6">Configure your savings group preferences</p>

      {message && (
        <div className={`p-3 rounded-md mb-4 ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}

      {/* General Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🏠 General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Group/Family Name</label>
              <input
                type="text"
                value={settings.familyName}
                onChange={(e) => setSettings({...settings, familyName: e.target.value})}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Smith Family Savings"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={settings.description}
                onChange={(e) => setSettings({...settings, description: e.target.value})}
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Describe your savings group..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({...settings, currency: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="UGX">UGX - Ugandan Shilling</option>
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="TZS">TZS - Tanzanian Shilling</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Loan Module Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">Enable Loans for this Group</p>
                <p className="text-sm text-gray-600">
                  When enabled, members can request loans. When disabled, the loan feature is hidden.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.loansEnabled}
                  onChange={(e) => setSettings({...settings, loansEnabled: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {settings.loansEnabled ? "ON" : "OFF"}
                </span>
              </label>
            </div>

            {settings.loansEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Default Interest Rate (%)</label>
                  <input
                    type="number"
                    value={settings.defaultInterestRate}
                    onChange={(e) => setSettings({...settings, defaultInterestRate: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Minimum Loan Amount</label>
                    <input
                      type="number"
                      value={settings.minLoanAmount}
                      onChange={(e) => setSettings({...settings, minLoanAmount: parseFloat(e.target.value)})}
                      className="w-full p-2 border rounded-md"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Maximum Loan Amount</label>
                    <input
                      type="number"
                      value={settings.maxLoanAmount}
                      onChange={(e) => setSettings({...settings, maxLoanAmount: parseFloat(e.target.value)})}
                      className="w-full p-2 border rounded-md"
                      placeholder="0 = unlimited"
                    />
                  </div>
                </div>
              </>
            )}

            {settings.loansEnabled ? (
              <div className="bg-green-50 p-3 rounded-lg text-green-700 text-sm">
                ✓ Loans are currently ENABLED. Members can request loans.
              </div>
            ) : (
              <div className="bg-red-50 p-3 rounded-lg text-red-700 text-sm">
                ✗ Loans are currently DISABLED. Members cannot request loans.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contribution Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Contribution Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Default Contribution Amount (UGX)</label>
              <input
                type="number"
                value={settings.contributionAmount}
                onChange={(e) => setSettings({...settings, contributionAmount: parseFloat(e.target.value)})}
                className="w-full p-2 border rounded-md"
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contribution Frequency</label>
              <select
                value={settings.contributionFrequency}
                onChange={(e) => setSettings({...settings, contributionFrequency: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.allowPartialPayments}
                onChange={(e) => setSettings({...settings, allowPartialPayments: e.target.checked})}
                className="h-4 w-4"
              />
              <label className="text-sm">Allow partial payments (members can pay less than full amount)</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Accounts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.paymentAccounts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No payment accounts configured</p>
            ) : (
              settings.paymentAccounts.map((account) => (
                <div key={account.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{account.account_name}</p>
                    <p className="text-lg font-mono">{account.account_number}</p>
                    <p className="text-sm text-gray-500 capitalize">{account.account_type.replace("_", " ")}</p>
                  </div>
                  <button
                    onClick={() => deletePaymentAccount(account.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}

            {!showAddAccount ? (
              <button
                onClick={() => setShowAddAccount(true)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                + Add Payment Account
              </button>
            ) : (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Add New Payment Account</h3>
                <select
                  value={newPaymentAccount.account_type}
                  onChange={(e) => setNewPaymentAccount({...newPaymentAccount, account_type: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="mtn_momo">MTN Mobile Money</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="bank">Bank Account</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Account Name (e.g., Group Savings MTN)"
                  value={newPaymentAccount.account_name}
                  onChange={(e) => setNewPaymentAccount({...newPaymentAccount, account_name: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Account Number / Phone Number"
                  value={newPaymentAccount.account_number}
                  onChange={(e) => setNewPaymentAccount({...newPaymentAccount, account_number: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
                {newPaymentAccount.account_type === "bank" && (
                  <input
                    type="text"
                    placeholder="Bank Name"
                    value={newPaymentAccount.bank_name}
                    onChange={(e) => setNewPaymentAccount({...newPaymentAccount, bank_name: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={addPaymentAccount}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    Save Account
                  </button>
                  <button
                    onClick={() => setShowAddAccount(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transparency Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>👁️ Transparency Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Transparency Mode</label>
              <select
                value={settings.transparencyMode}
                onChange={(e) => setSettings({...settings, transparencyMode: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="full">Full - Everyone sees all contributions</option>
                <option value="limited">Limited - Members see only their own</option>
                <option value="private">Private - Only admins see details</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.showMemberBalances}
                onChange={(e) => setSettings({...settings, showMemberBalances: e.target.checked})}
                className="h-4 w-4"
              />
              <label className="text-sm">Show member balances to all members</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.showContributionHistory}
                onChange={(e) => setSettings({...settings, showContributionHistory: e.target.checked})}
                className="h-4 w-4"
              />
              <label className="text-sm">Show contribution history to all members</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="sticky bottom-6">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold text-lg"
        >
          {saving ? "Saving..." : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}