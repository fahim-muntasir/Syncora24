import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  ArrowRightCircle,
  ChevronRight,
  Clock,
  HelpCircle,
  MessageSquareText,
  Mic,
  MicOff,
  MonitorOff,
  MonitorUp,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { roomSocketManager } from "@/libs/socket/index";
import { useAppSelector } from "@/libs/hooks";
import Chat from "./Chat";
import { ChatItem, IncomingMessage, Message, RoomActivity } from "@/types/chat";
import { RoomType } from "@/types/room";
import ParticipantsList from "./ParticipantsList";
import HostControls from "./HostControls";

type Tab = "Chat" | "Participants" | "Safety" | "Quizzes" | "Activity" | "Controls";

interface ActivityEvent {
  id: string;
  type:
    | "joined"
    | "left"
    | "speaking"
    | "raised_hand"
    | "camera-started"
    | "camera-stopped"
    | "microphone-started"
    | "microphone-stopped"
    | "screen-share-started"
    | "screen-share-stopped"
    | "camera-permission-changed"
    | "position-changed";
  name: string;
  detail?: string;
  timestamp: Date;
}

const activityConfig: Record<
  ActivityEvent["type"],
  { icon: LucideIcon; color: string; label: string }
> = {
  joined: { icon: ArrowRightCircle, color: "text-emerald-400", label: "joined" },
  left: { icon: ArrowRightCircle, color: "text-gray-500", label: "left" },
  speaking: { icon: Mic, color: "text-gray-400", label: "spoke" },
  raised_hand: { icon: Clock, color: "text-gray-400", label: "raised hand" },
  "camera-started": { icon: Video, color: "text-emerald-400", label: "started their camera" },
  "camera-stopped": { icon: VideoOff, color: "text-gray-500", label: "stopped their camera" },
  "microphone-started": { icon: Mic, color: "text-emerald-400", label: "turned on their microphone" },
  "microphone-stopped": { icon: MicOff, color: "text-gray-500", label: "turned off their microphone" },
  "screen-share-started": { icon: MonitorUp, color: "text-emerald-400", label: "started sharing their screen" },
  "screen-share-stopped": { icon: MonitorOff, color: "text-gray-500", label: "stopped sharing their screen" },
  "camera-permission-changed": { icon: Video, color: "text-gray-400", label: "changed camera permissions" },
  "position-changed": { icon: Users, color: "text-gray-400", label: "changed position" },
};

function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
        <Clock size={18} className="text-gray-700" />
        <span className="text-xs text-gray-600">Activity will appear here</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {events.map((event) => {
        const cfg = activityConfig[event.type];
        const Icon = cfg.icon;
        return (
          <div key={event.id} className="flex items-center gap-2.5">
            <Icon size={13} className={`shrink-0 ${cfg.color}`} />
            <span className="min-w-0 truncate text-xs text-gray-400">
              <span className="font-medium text-gray-200">{event.name}</span>{" "}
              {event.detail ?? cfg.label}
            </span>
            <span className="ml-auto shrink-0 text-[10px] tabular-nums text-gray-600">
              {event.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SafetyPanel() {
  return (
    <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="rounded-lg border border-white/[0.07] bg-[#161616] p-3.5">
        <div className="mb-1 flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-sm font-medium text-white">Actively moderated</span>
        </div>
        <p className="text-xs leading-relaxed text-gray-500">
          This room follows the community guidelines. Hosts and moderators can remove members who break them.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">
          Community reminders
        </h3>
        <ul className="space-y-2 text-xs leading-relaxed text-gray-500">
          <li>Be respectful and kind to all participants.</li>
          <li>You can leave at any time, no explanation needed.</li>
          <li>Moderators are here to help, not just to discipline.</li>
        </ul>
      </div>
    </div>
  );
}

export default function SidePanel({
  sidebarCollapsed,
  setSidebarCollapsed,
  room,
  speakingUsers = [],
  unMutedUsers = [],
  currentUserIsHost = false,
  currentUserIsModerator = false,
}: {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  room?: RoomType | null;
  speakingUsers?: string[];
  unMutedUsers?: string[];
  currentUserIsHost?: boolean;
  currentUserIsModerator?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Chat");
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  const currentUser = useAppSelector((state) => state.auth.user);
  const activeTabRef = useRef(activeTab);
  const sidebarCollapsedRef = useRef(sidebarCollapsed);

  const expanded = sidebarCollapsed;
  const isPrivileged = currentUserIsHost || currentUserIsModerator;
  const tab: Tab = activeTab === "Controls" && !isPrivileged ? "Chat" : activeTab;

  useEffect(() => { sidebarCollapsedRef.current = sidebarCollapsed; }, [sidebarCollapsed]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  useEffect(() => {
    const unsub = roomSocketManager.on("messageReceived", (payload: unknown) => {
      const data = payload as IncomingMessage;
      const isOwn = data.senderId === currentUser?.id;
      if (isOwn) return;

      const newMsg: Message = {
        id: `${data.senderId}-${data.timestamp}`,
        sender: "other",
        name: data.message.senderName,
        text: data.message.text,
        emojiOnly: data.message.emojiOnly,
        imageUrl: data.message.imageUrl,
        gifUrl: data.message.gifUrl,
        replyTo: data.message.replyTo ?? undefined,
        reactions: [],
      };

      if (activeTabRef.current !== "Chat" || !sidebarCollapsedRef.current) {
        setUnreadCount((prev) => prev + 1);
      }
      setMessages((prev) => [
        ...prev,
        { type: "message", id: newMsg.id, message: newMsg, timestamp: data.timestamp },
      ]);
    });
    return () => unsub();
  }, [currentUser?.id]);

  useEffect(() => {
    const unsub = roomSocketManager.on("room-activity", (payload: unknown) => {
      const activity = payload as RoomActivity;
      const item: ChatItem = {
        type: "activity",
        id: `activity-${activity.type}-${activity.timestamp}`,
        activity,
        timestamp: activity.timestamp,
      };
      setMessages((prev) => [...prev, item].sort((a, b) => a.timestamp - b.timestamp));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = roomSocketManager.on("room-activity", (payload: unknown) => {
      const activity = payload as RoomActivity;
      if (activity.type === "member-joined") {
        setActivityEvents((previous) => [
          ...previous,
          {
            id: `joined-${activity.timestamp}-${activity.userId}`,
            type: "joined",
            name: activity.userName,
            detail: activity.side
              ? `joined for ${activity.side === "for" ? "For" : "Against"}`
              : undefined,
            timestamp: new Date(activity.timestamp),
          },
        ]);
        return;
      }

      if (activity.type === "member-side-changed") {
        setActivityEvents((previous) => [
          ...previous,
          {
            id: `side-${activity.timestamp}-${activity.userId}`,
            type: "position-changed",
            name: activity.userName,
            detail: `changed to ${activity.side === "for" ? "For" : "Against"}`,
            timestamp: new Date(activity.timestamp),
          },
        ]);
        return;
      }

      if (
        activity.type !== "camera-started" &&
        activity.type !== "camera-stopped" &&
        activity.type !== "microphone-started" &&
        activity.type !== "microphone-stopped" &&
        activity.type !== "screen-share-started" &&
        activity.type !== "screen-share-stopped" &&
        activity.type !== "camera-permission-changed"
      ) {
        return;
      }

      const name =
        activity.type === "camera-permission-changed" ? activity.actorName : activity.userName;
      const detail =
        activity.type === "camera-permission-changed"
          ? `${activity.enabled ? "enabled" : "disabled"} camera access for ${
              activity.scope === "room" ? "the room" : activity.userName
            }`
          : undefined;

      setActivityEvents((previous) => [
        ...previous,
        {
          id: `${activity.type}-${activity.timestamp}-${activity.userId}`,
          type: activity.type,
          name,
          detail,
          timestamp: new Date(activity.timestamp),
        },
      ]);
    });
    return () => unsub();
  }, []);

  const tabs: { label: Tab; icon: React.ReactNode; badge?: number }[] = [
    { label: "Chat", icon: <MessageSquareText size={18} />, badge: unreadCount },
    { label: "Participants", icon: <Users size={18} /> },
    { label: "Activity", icon: <Activity size={18} /> },
    { label: "Safety", icon: <ShieldCheck size={18} /> },
    { label: "Quizzes", icon: <HelpCircle size={18} /> },
    ...(isPrivileged
      ? [{ label: "Controls" as Tab, icon: <SlidersHorizontal size={18} /> }]
      : []),
  ];

  const sideMenuHandler = (label: Tab) => {
    setActiveTab(label);
    if (label === "Chat") setUnreadCount(0);
    setSidebarCollapsed(true);
  };

  const tabTitles: Record<Tab, string> = {
    Chat: "Chat",
    Participants: `Participants${room ? ` · ${room.members.length}` : ""}`,
    Safety: "Safety",
    Quizzes: "Quizzes",
    Activity: "Activity",
    Controls: "Room controls",
  };

  const badge = (count?: number) =>
    count != null && count > 0 ? (
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-green-500 px-0.5 text-[9px] font-semibold text-white">
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  return (
    <>
      {expanded && (
        <div
          className="fixed inset-0 z-20 bg-[#0b0b0b]/70 lg:hidden"
          onClick={() => setSidebarCollapsed(false)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Room side panel"
        className={`flex shrink-0 flex-col border-l border-white/[0.06] bg-[#0f0f0f] ${
          expanded
            ? "fixed inset-y-0 right-0 z-30 w-full max-w-sm lg:static lg:z-auto lg:w-[22rem] lg:max-w-none"
            : "w-14"
        }`}
      >
        {!expanded && (
          <>
            <div className="h-14 shrink-0 border-b border-white/[0.06]" />
            <div className="flex flex-col items-center gap-1 py-3">
              {tabs.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => sideMenuHandler(item.label)}
                  title={item.label}
                  aria-label={item.label}
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60 motion-reduce:transition-none"
                >
                  {item.icon}
                  {badge(item.badge)}
                </button>
              ))}
            </div>
          </>
        )}

        {expanded && (
          <>
            <div className="flex h-14 shrink-0 items-center gap-0.5 border-b border-white/[0.06] px-3">
              {tabs.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => sideMenuHandler(item.label)}
                  title={item.label}
                  aria-label={item.label}
                  aria-pressed={tab === item.label}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60 motion-reduce:transition-none ${
                    tab === item.label
                      ? "bg-white/[0.09] text-white"
                      : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-200"
                  }`}
                >
                  {item.icon}
                  {badge(item.badge)}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                aria-label="Collapse panel"
                title="Collapse panel"
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60 motion-reduce:transition-none"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="shrink-0 border-b border-white/[0.04] px-4 py-2.5">
              <h2 className="text-xs font-semibold text-gray-300">{tabTitles[tab]}</h2>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {tab === "Chat" && <Chat messages={messages} setMessages={setMessages} />}
              {tab === "Participants" && (
                <ParticipantsList
                  room={room ?? null}
                  speakingUsers={speakingUsers}
                  unMutedUsers={unMutedUsers}
                  currentUserIsHost={currentUserIsHost}
                  currentUserIsModerator={currentUserIsModerator}
                />
              )}
              {tab === "Safety" && <SafetyPanel />}
              {tab === "Quizzes" && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                  <HelpCircle size={20} className="text-gray-600" />
                  <p className="text-sm font-medium text-white">Quizzes</p>
                  <p className="text-xs leading-relaxed text-gray-500">
                    Interactive language quizzes are coming soon.
                  </p>
                </div>
              )}
              {tab === "Activity" && <ActivityFeed events={activityEvents} />}
              {tab === "Controls" && isPrivileged && (
                <HostControls room={room ?? null} currentUserIsHost={currentUserIsHost} />
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}