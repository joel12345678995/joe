"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Copy, CheckCircle, AlertCircle } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PaymentAccount {
  id: string;
  account_name: string;
  account_number: string;
  account_type?: string | null;
}

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [userFamilyId, setUserFamilyId] = useState("");
  const [userMemberId, setUserMemberId] = useState("");
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPaymentAccounts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: member } = await supabase
          .from("family_members")
          .select("id, family_id")
          .eq("user_id", user.id)
          .single();

        if (member) {
          setUserMemberId(member.id);
          setUserFamilyId(member.family_id);

          const { data: accounts } = await supabase
            .from("payment_accounts")
            .select("*")
            .eq("family_id", member.family_id)
            .eq("is_active", true);

          setPaymentAccounts((accounts as PaymentAccount[]) || []);
        }
      } catch (error) {
        console.error("Error fetching payment accounts:", error);
      }
    };

    fetchPaymentAccounts();
  }, [isOpen, supabase]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("✅ Copied to clipboard!");
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setMessage("Please enter a valid amount");
      return;
    }
    if (!method) {
      setMessage("Please select a payment method");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let proofUrl = null;
      if (proof) {
        const fileName = `${Date.now()}-${proof.name}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(fileName, proof);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("receipts")
            .getPublicUrl(fileName);
          proofUrl = publicUrl;
        }
      }

      const { error: insertError } = await supabase
        .from("payment_requests")
        .insert({
          family_id: userFamilyId,
          member_id: userMemberId,
          amount: parseFloat(amount),
          payment_method: method,
          transaction_id: transactionId,
          payment_proof_url: proofUrl,
          status: "pending"
        });

      if (insertError) throw insertError;

      setMessage("✅ Payment request submitted! The admin will verify it soon.");
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        setAmount("");
        setMethod("");
        setTransactionId("");
        setProof(null);
        setMessage("");
      }, 2000);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setMessage(`❌ Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">💸 Make a Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Payment Accounts */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Official Payment Accounts:</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {paymentAccounts.length === 0 ? (
                <p className="text-gray-500 col-span-2 text-center py-4">No payment accounts configured. Please contact your admin.</p>
              ) : (
                paymentAccounts.map((acc) => (
                  <div key={acc.id} className="bg-gray-50 rounded-lg p-3 border">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{acc.account_name}</p>
                        <p className="text-lg font-mono font-bold text-blue-600">{acc.account_number}</p>
                        <p className="text-sm text-gray-500 capitalize">{acc.account_type?.replace("_", " ")}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(acc.account_number)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Copy className="h-4 w-4" /> Copy
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-t pt-4">Submit Payment Request</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Amount (UGX) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Payment Method *</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select method</option>
                <option value="mtn_momo">MTN Mobile Money</option>
                <option value="airtel_money">Airtel Money</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Transaction ID/Reference</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction reference"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Payment Proof (Screenshot)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProof(e.target.files?.[0] || null)}
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Upload a screenshot of your payment confirmation</p>
            </div>

            {message && (
              <div className={`p-3 rounded-md flex items-center gap-2 ${
                message.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
              }`}>
                {message.includes("Error") ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                {message}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold text-lg"
            >
              {submitting ? "Submitting..." : "Submit Payment Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}