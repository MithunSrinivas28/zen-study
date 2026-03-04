import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: any;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    const items = (data ?? []) as any as Notification[];
    setNotifications(items);
    setUnreadCount(items.filter((n) => !n.read).length);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  // Real-time
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => { fetch(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetch]);

  const markRead = async (id: string) => {
    await supabase.from("notifications" as any).update({ read: true } as any).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications" as any).update({ read: true } as any).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetch };
}
