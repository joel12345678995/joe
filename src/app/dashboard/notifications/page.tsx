"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link: string | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [userRole, setUserRole] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to real-time notifications
    const subscription = supabase
      .channel('notifications_channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          // Add new notification to the list
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show browser notification if supported
          if (Notification.permission === "granted") {
            new Notification(newNotification.title, {
              body: newNotification.message
            });
          }
        }
      )
      .subscribe();

    // Request notification permission
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's role
      const { data: currentMember } = await supabase
        .from("family_members")
        .select("role, family_id")
        .eq("user_id", user.id)
        .single();

      if (currentMember) {
        setUserRole(currentMember.role);

        // Fetch notifications
        const { data: notificationsData } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setNotifications(notificationsData || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (!error) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      for (const id of unreadIds) {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", id);
      }
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment_verified":
        return "✅";
      case "payment_pending":
        return "⏳";
      case "payment_rejected":
        return "❌";
      case "loan_approved":
        return "✓";
      case "loan_rejected":
        return "✗";
      case "loan_request":
        return "💰";
      case "contribution_due":
        return "📅";
      case "overdue":
        return "⚠️";
      case "member_joined":
        return "👤";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "payment_verified":
      case "loan_approved":
        return "bg-green-50 border-green-200";
      case "payment_pending":
      case "loan_request":
        return "bg-yellow-50 border-yellow-200";
      case "payment_rejected":
      case "loan_rejected":
        return "bg-red-50 border-red-200";
      case "contribution_due":
        return "bg-blue-50 border-blue-200";
      case "overdue":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "all" 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "unread" 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter("read")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "read" 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Read
        </button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No notifications found</p>
              <p className="text-sm text-gray-400 mt-1">
                When you receive notifications, they will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-all ${!notification.is_read ? "bg-blue-50/30" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-semibold ${!notification.is_read ? "text-blue-800" : "text-gray-800"}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {getTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              title="Mark as read"
                            >
                              ✓ Mark read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            ✗ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types Legend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <span className="text-xl">✅</span>
              <div>
                <p className="font-semibold text-sm">Payment Verified</p>
                <p className="text-xs text-gray-500">Your contribution has been verified</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
              <span className="text-xl">⏳</span>
              <div>
                <p className="font-semibold text-sm">Payment Pending</p>
                <p className="text-xs text-gray-500">Your payment is awaiting verification</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
              <span className="text-xl">❌</span>
              <div>
                <p className="font-semibold text-sm">Payment Rejected</p>
                <p className="text-xs text-gray-500">Your payment was rejected</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <span className="text-xl">✓</span>
              <div>
                <p className="font-semibold text-sm">Loan Approved</p>
                <p className="text-xs text-gray-500">Your loan request has been approved</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
              <span className="text-xl">✗</span>
              <div>
                <p className="font-semibold text-sm">Loan Rejected</p>
                <p className="text-xs text-gray-500">Your loan request was rejected</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
              <div>
                <p className="font-semibold text-sm">Contribution Due</p>
                <p className="text-xs text-gray-500">Reminder for upcoming contribution</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}