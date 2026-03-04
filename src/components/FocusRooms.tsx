import { useState } from "react";
import { useFriends } from "@/hooks/useFriends";
import { useFocusSession } from "@/hooks/useFocusSession";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Clock, X, Check, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function FocusRooms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { friends, incomingRequests, sendRequest, acceptRequest, declineRequest, loading: friendsLoading } = useFriends();
  const {
    activeSession, participants, pendingInvites, elapsed,
    isFocusPhase, isBreakPhase, isCompleted, phaseRemaining,
    createSession, acceptInvite, declineInvite, leaveSession, completeSession,
  } = useFocusSession();

  const [tab, setTab] = useState<"friends" | "invite" | "requests">("friends");
  const [friendUsername, setFriendUsername] = useState("");
  const [sending, setSending] = useState(false);

  if (!user) return null;

  // If in active session, show the study room
  if (activeSession && activeSession.status === "in_progress") {
    const phase = isFocusPhase ? "Focus" : isBreakPhase ? "Break" : "Complete";
    const progress = isFocusPhase
      ? elapsed / activeSession.focus_duration
      : isBreakPhase
      ? (elapsed - activeSession.focus_duration) / activeSession.break_duration
      : 1;

    // Auto-complete when session time is fully elapsed
    if (isCompleted) {
      completeSession();
    }

    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-wide mb-1">
            Shared {phase}
          </p>
          <p className="text-5xl font-serif font-bold text-foreground tabular-nums tracking-tight">
            {formatTime(Math.max(0, phaseRemaining))}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>

        {/* Participants */}
        <div className="flex justify-center gap-4 mb-4">
          {participants.filter((p) => p.status === "joined").map((p) => (
            <div key={p.id} className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1">
                <span className="text-sm font-serif font-bold text-primary">
                  {(p.username ?? "?")[0].toUpperCase()}
                </span>
              </div>
              <p className="text-xs font-body text-muted-foreground">{p.username}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button variant="destructive" size="sm" onClick={leaveSession} className="font-body">
            <LogOut size={14} className="mr-1" /> Leave Session
          </Button>
        </div>
      </div>
    );
  }

  // Pending session (waiting for friend to accept)
  if (activeSession && activeSession.status === "pending") {
    const invitedPerson = participants.find((p) => p.status === "invited");
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <Clock size={24} className="mx-auto mb-2 text-muted-foreground" />
        <p className="font-body text-sm text-foreground mb-1">Waiting for {invitedPerson?.username ?? "friend"} to join...</p>
        <p className="text-xs text-muted-foreground font-body">They've been notified</p>
        <Button variant="outline" size="sm" className="mt-3 font-body" onClick={leaveSession}>
          Cancel
        </Button>
      </div>
    );
  }

  const handleAddFriend = async () => {
    if (!friendUsername.trim()) return;
    setSending(true);
    const result = await sendRequest(friendUsername.trim());
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Request sent!", description: `Friend request sent to ${friendUsername}` });
      setFriendUsername("");
    }
    setSending(false);
  };

  const handleInvite = async (friendId: string) => {
    const sessionId = await createSession(friendId);
    if (sessionId) {
      toast({ title: "Invite sent!", description: "Waiting for your friend to join..." });
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <h3 className="font-serif font-bold text-foreground text-sm mb-3 flex items-center gap-2">
        <Users size={16} /> Focus Rooms
      </h3>

      {/* Pending focus invites */}
      {pendingInvites.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wide">Session Invites</p>
          {pendingInvites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2 border border-primary/20">
              <div>
                <p className="text-sm font-body text-foreground">{inv.creator_username}</p>
                <p className="text-xs text-muted-foreground font-body">50 min focus session</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="h-7 px-2 font-body" onClick={() => acceptInvite(inv.id, inv.session_id)}>
                  <Check size={12} />
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2 font-body" onClick={() => declineInvite(inv.id)}>
                  <X size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friend request notifications */}
      {incomingRequests.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wide">Friend Requests</p>
          {incomingRequests.map((req) => (
            <div key={req.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-sm font-body text-foreground">{req.from_username}</p>
              <div className="flex gap-1">
                <Button size="sm" className="h-7 px-2 font-body" onClick={() => acceptRequest(req.id, req.from_user_id)}>
                  <Check size={12} />
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2 font-body" onClick={() => declineRequest(req.id)}>
                  <X size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        {(["friends", "invite", "requests"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-body transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t === "friends" ? "Friends" : t === "invite" ? "Add Friend" : "Sent"}
          </button>
        ))}
      </div>

      {tab === "friends" && (
        <div className="space-y-1.5">
          {friends.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body text-center py-3">
              No friends yet. Add someone to study together!
            </p>
          ) : (
            friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50">
                <p className="text-sm font-body text-foreground">{friend.username}</p>
                <Button size="sm" variant="outline" className="h-7 text-xs font-body" onClick={() => handleInvite(friend.id)}>
                  Study Together
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "invite" && (
        <div className="flex gap-2">
          <Input
            value={friendUsername}
            onChange={(e) => setFriendUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
            placeholder="Enter username..."
            className="h-8 text-sm"
          />
          <Button size="sm" onClick={handleAddFriend} disabled={sending || !friendUsername.trim()} className="h-8 px-3 font-body">
            <UserPlus size={14} />
          </Button>
        </div>
      )}

      {tab === "requests" && (
        <p className="text-xs text-muted-foreground font-body text-center py-3">
          Sent requests will appear here
        </p>
      )}
    </div>
  );
}
