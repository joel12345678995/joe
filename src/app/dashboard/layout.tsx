"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  LayoutDashboard,
  Wallet,
  Eye,
  Landmark,
  Users,
  BarChart3,
  Upload,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  UserPlus,
  Crown,
  Shield,
  DollarSign
} from "lucide-react";
import PaymentModal from "@/components/PaymentModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("member");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUserAndRole = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push("/auth/login");
          return;
        }
        
        setUser(user);
        
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_super_admin")
          .eq("id", user.id)
          .single();
        
        if (profile?.is_super_admin === true) {
          setUserRole("super_admin");
          setLoading(false);
          return;
        }
        
        const { data: familyMember, error: fmError } = await supabase
          .from("family_members")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (familyMember?.role) {
          setUserRole(familyMember.role);
        } else {
          setUserRole("member");
        }
        
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };
    
    getUserAndRole();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/auth/login");
      } else {
        setUser(session.user);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getNavItems = () => {
    const commonItems = [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/contributions", label: "Contributions", icon: Wallet },
      { href: "/dashboard/transparency", label: "Transparency", icon: Eye },
      { href: "/dashboard/loans", label: "Loans", icon: Landmark },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];
    
    const adminItems = [
      { href: "/dashboard/members", label: "Members", icon: Users },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ];
    
    const superAdminItems = [
      { href: "/admin/create-leader", label: "Create Group Leader", icon: Crown },
      { href: "/admin/families", label: "Manage Families", icon: Shield },
      { href: "/dashboard/migration", label: "Migration", icon: Upload },
    ];
    
    const familyAdminItems = [
      { href: "/dashboard/members/create", label: "Add Member", icon: UserPlus },
    ];
    
    let items = [...commonItems];
    
    if (userRole === "super_admin") {
      items = [...items, ...adminItems, ...superAdminItems];
    } else if (userRole === "family_admin") {
      items = [...items, ...adminItems, ...familyAdminItems];
    } else if (userRole === "treasurer" || userRole === "secretary" || userRole === "auditor") {
      items = [...items, ...adminItems];
    }
    
    return items;
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    switch (userRole) {
      case "super_admin": return "bg-purple-100 text-purple-700";
      case "family_admin": return "bg-blue-100 text-blue-700";
      case "treasurer": return "bg-green-100 text-green-700";
      case "secretary": return "bg-orange-100 text-orange-700";
      case "auditor": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case "super_admin": return "Super Admin";
      case "family_admin": return "Family Admin";
      case "treasurer": return "Treasurer";
      case "secretary": return "Secretary";
      case "auditor": return "Auditor";
      default: return "Member";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              JoeFamily Treasury
            </h1>
            <div className="mt-2">
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge()}`}>
                {getRoleLabel()}
              </span>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-200 space-y-2">
            {/* Floating Payment Button in Sidebar */}
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full flex items-center gap-3 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors mb-2"
            >
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">Make a Payment</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowPaymentModal(true)}
          className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors"
        >
          <DollarSign className="h-6 w-6" />
        </button>
      </div>

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          // Refresh data on the current page after successful payment
          window.location.reload();
        }}
      />
    </div>
  );
}