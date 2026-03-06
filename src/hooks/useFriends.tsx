import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Friend {
  id: string;
  username: string;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_username: string;
  status: string;
  created_at: string;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friendships" as any)
      .select("id, user_id, friend_id")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (!data) { setFriends([]); return; }

    const friendIds = (data as any[]).map((f: any) =>
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    if (friendIds.length === 0) { setFriends([]); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", friendIds);

    setFriends((profiles ?? []).map((p) => ({ id: p.id, username: p.username })));
  }, [user]);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friend_requests" as any)
      .select("id, from_user_id, to_user_id, status, created_at")
      .eq("to_user_id", user.id)
      .eq("status", "pending");

    if (!data) { setIncomingRequests([]); return; }

    // Get usernames for requesters
    const fromIds = (data as any[]).map((r: any) => r.from_user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", fromIds);

    const usernameMap = new Map((profiles ?? []).map((p) => [p.id, p.username]));

    setIncomingRequests(
      (data as any[]).map((r: any) => ({
        ...r,
        from_username: usernameMap.get(r.from_user_id) ?? "Unknown",
      }))
    );
  }, [user]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchFriends(), fetchRequests()]);
    setLoading(false);
  }, [fetchFriends, fetchRequests]);

  useEffect(() => { refresh(); }, [refresh]);

  // Real-time subscription for friend requests
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("friend-requests")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "friend_requests",
        filter: `to_user_id=eq.${user.id}`,
      }, () => { fetchRequests(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchRequests]);

  const sendRequest = async (username: string) => {
    if (!user) return { error: "Not logged in" };
    const { data: target } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (!target) return { error: "User not found" };
    if (target.id === user.id) return { error: "Cannot add yourself" };

    const { error } = await supabase.from("friend_requests" as any).insert({
      from_user_id: user.id,
      to_user_id: target.id,
    } as any);

    if (error) {
      if (error.code === "23505") return { error: "Request already sent" };
      return { error: error.message };
    }

    // Create notification
    await supabase.from("notifications" as any).insert({
      user_id: target.id,
      type: "friend_request",
      title: "Friend Request",
      body: `${(await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()).data?.username} sent you a friend request`,
      data: { from_user_id: user.id },
    } as any);

    return { error: null };
  };

  const acceptRequest = async (requestId: string, fromUserId: string) => {
    if (!user) return;
    await supabase.from("friend_requests" as any).update({ status: "accepted" } as any).eq("id", requestId);
    // Create bidirectional friendship
    await supabase.from("friendships" as any).insert({ user_id: user.id, friend_id: fromUserId } as any);
    await refresh();
  };

  const declineRequest = async (requestId: string) => {
    await supabase.from("friend_requests" as any).update({ status: "declined" } as any).eq("id", requestId);
    await refresh();
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;
    await supabase.from("friendships" as any).delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
    await refresh();
  };

  return { friends, incomingRequests, loading, sendRequest, acceptRequest, declineRequest, removeFriend, refresh };
}
