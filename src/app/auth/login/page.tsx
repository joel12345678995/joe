"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password, 
      });
      
      if (error) throw error;
      
      if (data?.session) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please contact your group leader if you need access.");
      } else {
        setError(error.message || "Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>
          
          <form onSubmit={signIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full"
              />
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Authorized access only</p>
              <p className="text-xs mt-1">Contact your group administrator for credentials</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}