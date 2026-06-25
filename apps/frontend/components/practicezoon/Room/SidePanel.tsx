import React, { useState, useEffect, useRef } from "react";
import {
  ChevronRight, MessageSquareText, Users, HelpCircle,
  ShieldCheck, Crown, Mic, MicOff, UserMinus, Flag,
  Clock, Sparkles, ArrowRightCircle,
  Activity,
} from "lucide-react";
import { socketManager } from "@/libs/socket/index";
import { useAppSelector } from "@/libs/hooks";
import Chat from "./Chat";
import { IncomingMessage, Message } from "@/types/chat";
import { RoomType } from "@/types/room";
import Image from "next/image";
import { generateIdenticonAvatar } from "@/utils/generateAvatar";

// Minimal activity event type for the feed
interface ActivityEvent {
  id: string;
  type: "joined" | "left" | "speaking" | "raised_hand";
  name: string;
  timestamp: Date;
}

// Mock moderator IDs — replace with real store/context
const MOCK_MODERATOR_IDS = ["2"];

// ── PARTICIPANT LIST COMPONENT ─────────────────────────────────────
function ParticipantsList({
  room,
  speakingUsers,
  unMutedUsers,
  currentUserIsHost,
}: {
  room: RoomType | null;
  speakingUsers: string[];
  unMutedUsers: string[];
  currentUserIsHost?: boolean;
}) {
  if (!room) return (
    <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
      Loading participants…
    </div>
  );

  const host = room.members.filter((m) => m.id === room.hostId);
  const moderators = room.members.filter((m) => MOCK_MODERATOR_IDS.includes(m.id) && m.id !== room.hostId);
  const members = room.members.filter((m) => m.id !== room.hostId && !MOCK_MODERATOR_IDS.includes(m.id));

  const renderMember = (member: typeof room.members[0], roleLabel: string, roleColor: string) => {
    const isSpeaking = speakingUsers.includes(member.id);
    const isUnMuted = unMutedUsers.includes(member.id);
    const avatarSvg = !member.avatar ? generateIdenticonAvatar(member.name, 36) : null;

    return (
      <div
        key={member.id}
        className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-white/[0.04] ${isSpeaking ? "bg-green-500/5 border border-green-500/10" : ""
          }`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {member.avatar ? (
            <Image
              src={member.avatar}
              alt={member.name}
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: avatarSvg! }}
              className="w-9 h-9 rounded-full overflow-hidden border border-white/10"
            />
          )}
          {/* Online dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0e0e0e] bg-green-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xs font-medium truncate">{member.name}</span>
            {isSpeaking && (
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
          </div>
          <span className={`text-[10px] font-medium ${roleColor}`}>{roleLabel}</span>
        </div>

        {/* Right: mic + actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className={`p-1 rounded-md ${isUnMuted ? "text-green-400/80" : "text-red-400/50"}`}>
            {isUnMuted ? <Mic size={11} /> : <MicOff size={11} />}
          </div>

          {/* Host-only quick actions */}
          {currentUserIsHost && member.id !== room.hostId && (
            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
              <button className="p-1 rounded-md hover:bg-white/[0.08] text-gray-600 hover:text-orange-400 transition-colors" title="Remove">
                <UserMinus size={11} />
              </button>
              <button className="p-1 rounded-md hover:bg-white/[0.08] text-gray-600 hover:text-blue-400 transition-colors" title="Report">
                <Flag size={11} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {/* Host section */}
      {host.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-3 mb-1.5">
            <Crown size={10} className="text-amber-400/70" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60">Host</span>
          </div>
          {host.map((m) => renderMember(m, "Host", "text-amber-400"))}
        </div>
      )}

      {/* Moderators section */}
      {moderators.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-3 mb-1.5">
            <ShieldCheck size={10} className="text-blue-400/70" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/60">Moderators</span>
          </div>
          {moderators.map((m) => renderMember(m, "Moderator", "text-blue-400"))}
        </div>
      )}

      {/* Members section */}
      {members.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-3 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
              Members · {members.length}
            </span>
          </div>
          {members.map((m) => renderMember(m, "Member", "text-gray-500"))}
        </div>
      )}

      {/* Future: AI insights placeholder */}
      <div className="mx-1 p-3 rounded-xl border border-dashed border-purple-500/15 bg-purple-500/3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={12} className="text-purple-400/40" />
          <span className="text-[10px] font-semibold text-purple-400/40 uppercase tracking-wider">AI Insights</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/15 text-purple-400/50">Soon</span>
        </div>
        <p className="text-[10px] text-gray-700">Participation scores, speaking time, communication streaks and country badges will appear here.</p>
      </div>
    </div>
  );
}

// ── ACTIVITY FEED COMPONENT ────────────────────────────────────────
function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const typeConfig = {
    joined: { icon: ArrowRightCircle, color: "text-green-400", bg: "bg-green-500/10", label: "joined" },
    left: { icon: ArrowRightCircle, color: "text-gray-500", bg: "bg-white/[0.04]", label: "left" },
    speaking: { icon: Mic, color: "text-blue-400", bg: "bg-blue-500/10", label: "spoke" },
    raised_hand: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", label: "raised hand" },
  };

  if (events.length === 0) return (
    <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
      <Clock size={18} className="text-gray-700" />
      <span className="text-xs text-gray-600">Activity will appear here</span>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {events.map((event) => {
        const cfg = typeConfig[event.type];
        const Icon = cfg.icon;
        return (
          <div key={event.id} className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${cfg.bg} flex-shrink-0`}>
              <Icon size={11} className={cfg.color} />
            </div>
            <span className="text-xs text-gray-400 truncate">
              <span className="font-medium text-white">{event.name}</span> {cfg.label}
            </span>
            <span className="ml-auto text-[10px] text-gray-700 flex-shrink-0">
              {event.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── SAFETY PANEL COMPONENT ─────────────────────────────────────────
function SafetyPanel() {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {/* Safety status */}
      <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-sm font-semibold text-white">Room is safe</span>
        </div>
        <p className="text-xs text-gray-500">This room is actively moderated and follows community guidelines.</p>
      </div>

      {/* Quick actions */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 block mb-2">Quick actions</span>
        <div className="space-y-1.5">
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors text-left">
            <Flag size={14} className="text-orange-400 flex-shrink-0" /> Report a user
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors text-left">
            <UserMinus size={14} className="text-gray-400 flex-shrink-0" /> Block a user
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15 text-sm text-red-400/80 hover:bg-red-500/12 hover:text-red-400 transition-colors text-left">
            <Flag size={14} className="text-red-400 flex-shrink-0" /> Report this room
          </button>
        </div>
      </div>

      {/* Reminders */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 block mb-2">Community reminders</span>
        <div className="space-y-2 text-xs text-gray-500 leading-relaxed">
          <p>· Be respectful and kind to all participants.</p>
          <p>· You can leave at any time — no explanation needed.</p>
          <p>· Any behaviour that makes you uncomfortable can be reported.</p>
          <p>· Moderators are here to help — not just to discipline.</p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN SIDE PANEL ────────────────────────────────────────────────
export default function SidePanel({
  sidebarCollapsed,
  setSidebarCollapsed,
  room,
  speakingUsers = [],
  unMutedUsers = [],
  currentUserIsHost = false,
}: {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  room?: RoomType | null;
  speakingUsers?: string[];
  unMutedUsers?: string[];
  currentUserIsHost?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"Chat" | "Participants" | "Safety" | "Quizzes" | "Activity">("Chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  const currentUser = useAppSelector((state) => state.auth.user);
  const activeTabRef = useRef(activeTab);
  const sidebarCollapsedRef = useRef(sidebarCollapsed);

  useEffect(() => {
    setActivityEvents([
      {
        id: "1",
        type: "joined",
        name: "Sarah Johnson",
        timestamp: new Date(Date.now() - 1000 * 60 * 20),
      },
      {
        id: "2",
        type: "speaking",
        name: "Ahmed Rahman",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
      },
      {
        id: "3",
        type: "raised_hand",
        name: "Maria Garcia",
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
      },
      {
        id: "4",
        type: "joined",
        name: "Emily Chen",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
      },
      {
        id: "5",
        type: "left",
        name: "David Wilson",
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
      },
    ])
  }, [])

  useEffect(() => { sidebarCollapsedRef.current = sidebarCollapsed; }, [sidebarCollapsed]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // Inbound chat messages
  useEffect(() => {
    const unsub = socketManager.on("messageReceived", (payload: unknown) => {
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
      setMessages((prev) => [...prev, newMsg]);
    });
    return () => unsub();
  }, [currentUser?.id]);

  const icons: { label: typeof activeTab; icon: React.ReactNode; badge?: number; soon?: boolean }[] = [
    { label: "Chat", icon: <MessageSquareText size={20} />, badge: unreadCount },
    { label: "Participants", icon: <Users size={20} /> },
    { label: "Safety", icon: <ShieldCheck size={20} /> },
    { label: "Quizzes", icon: <HelpCircle size={20} />, soon: true },
    { label: "Activity", icon: <Activity size={20} /> },
  ];

  const sideMenuHandler = (label: typeof activeTab) => {
    setActiveTab(label);
    if (label === "Chat") setUnreadCount(0);
    setSidebarCollapsed(true);
  };

  const tabTitles: Record<typeof activeTab, string> = {
    Chat: "Chat",
    Participants: `Participants${room ? ` · ${room.members.length}` : ""}`,
    Safety: "Safety Center",
    Quizzes: "Quizzes",
    Activity: "Activity",
  };

  return (
    <div className={`bg-[#0d0d0d] z-10 border-l border-white/[0.06] flex flex-col transition-all duration-300 ${!sidebarCollapsed ? "w-14" : "w-[22rem]"}`}>

      {/* ── COLLAPSED: Icon rail ─────────────────────── */}
      {!sidebarCollapsed && (
        <div className="flex flex-col items-center gap-1 pt-4 pb-8 flex-1 justify-end">
          {icons.map((item) => (
            <button
              key={item.label}
              onClick={() => sideMenuHandler(item.label)}
              title={item.label}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/[0.06] text-gray-500 hover:text-white transition-all"
            >
              {item.icon}
              {item.badge != null && item.badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
              {item.soon && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-400/60 border border-[#0d0d0d]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── EXPANDED ────────────────────────────────── */}
      {sidebarCollapsed && (
        <>
          {/* Tab strip */}
          <div className="flex items-center gap-0.5 h-14 border-b border-white/[0.06] px-3 flex-shrink-0">
            {icons.map((item) => (
              <button
                key={item.label}
                onClick={() => sideMenuHandler(item.label)}
                title={item.label}
                className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-all ${activeTab === item.label
                  ? "bg-white/[0.09] text-white"
                  : "text-gray-600 hover:text-gray-300 hover:bg-white/[0.04]"
                  }`}
              >
                {item.icon}
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                {item.soon && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-400/60 border border-[#0d0d0d]" />
                )}
              </button>
            ))}

            {/* Collapse button */}
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="ml-auto p-2 rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Tab title */}
          <div className="px-4 py-2.5 border-b border-white/[0.04] flex-shrink-0">
            <span className="text-xs font-semibold text-gray-400">{tabTitles[activeTab]}</span>
          </div>

          {/* Tab content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeTab === "Chat" && (
              <Chat messages={messages} setMessages={setMessages} />
            )}
            {activeTab === "Participants" && (
              <ParticipantsList
                room={room ?? null}
                speakingUsers={speakingUsers}
                unMutedUsers={unMutedUsers}
                currentUserIsHost={currentUserIsHost}
              />
            )}
            {activeTab === "Safety" && <SafetyPanel />}
            {activeTab === "Quizzes" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center">
                  <HelpCircle size={20} className="text-purple-400/50" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Quizzes</p>
                  <p className="text-xs text-gray-500">Interactive language quizzes and challenges are coming soon.</p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/15 text-purple-400/60">
                  Coming soon
                </span>
              </div>
            )}
            {activeTab === "Activity" && (
              <ActivityFeed events={activityEvents} />
            )}
          </div>
        </>
      )}
    </div>
  );
}