import React from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Modal from "../../common/Modal";
import {
  Users, Globe2, Crown, DoorOpen, ArrowLeft, Mic, Hash,
  ShieldCheck, BadgeCheck, Lock, Star, Sparkles, Clock,
} from "lucide-react";
import { RoomType } from "@/types/room";
import { useAddRoomMemberMutation } from "@/libs/features/room/roomApiSlice";
import { useAppSelector } from "@/libs/hooks";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import Image from "next/image";

const mockRoom: RoomType = {
  id: "1",
  title: "English Conversation Practice",
  description: "Let's practice everyday English conversation! All levels welcome.",
  language: "English",
  level: "Intermediate",
  maxParticipants: 6,
  hostId: "5",
  status: "active",
  createdAt: new Date().toISOString(),
  members: [
    { id: "1", name: "Sarah Johnson", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
    { id: "2", name: "Miguel Rodriguez", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
    { id: "3", name: "Yuki Tanaka", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
    { id: "4", name: "Hans Weber", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
  ],
};

// Mock: in real use, derive from host profile data
const mockHostMeta = {
  isVerified: true,
  isTrusted: true,
  hostRating: 4.9,
  sessionsHosted: 47,
  memberSince: "2023",
};

const levelConfig: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Beginner:     { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  Intermediate: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20",   dot: "bg-amber-400"  },
  Advanced:     { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/20",  dot: "bg-orange-400" },
  Native:       { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20",    dot: "bg-blue-400"   },
};

// Role config for participant list
const MOCK_MODERATOR_IDS = ["2"]; // simulate moderator

interface Props {
  isOpen: boolean;
  onClose: () => void;
  handleUserJoined: (data: { user: { id: string; name: string } }) => void;
  handleUserLeft: (data: { memberId: string }) => void;
}

export default function RoomDetailsModal({ isOpen, onClose, handleUserJoined, handleUserLeft }: Props) {
  const [addRoomMember, { isLoading }] = useAddRoomMemberMutation();
  const currentUser = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const { id } = useParams();
  const roomId = Array.isArray(id) ? id[0] : id;
  const room = mockRoom;

  const level = levelConfig[room.level] ?? levelConfig.Beginner;
  const spotsLeft = room.maxParticipants - room.members.length;

  const { joinRoom, leaveRoom } = useRoomSocket({
    roomId,
    currentUserId: currentUser?.id,
    currentUserName: currentUser?.fullName,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
  });

  const joinRoomHandler = async () => {
    if (!roomId) return toast.error("Room ID is missing.");
    if (!currentUser?.id) return toast.error("User not authenticated.");

    const joinPromise = addRoomMember(roomId).unwrap();
    toast.promise(joinPromise, {
      loading: "Joining room…",
      success: "You joined the room!",
      error: (err: { data?: { error?: string } }) => err?.data?.error ?? "Failed to join room.",
    });

    try {
      await joinPromise;
      await joinRoom();
      onClose();
    } catch (err) {
      console.error("Join room failed:", err);
    }
  };

  const handleBackToHome = () => {
    leaveRoom();
    router.push("/");
  };

  if (isOpen) return null;

  const hostMember = room.members.find((m) => m.id === room.hostId);

  return (
    <Modal>
      <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

        {/* ── SAFETY BANNER ─────────────────────────────────── */}
        {/* Immediately signals: this room is governed and safe */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15 mb-6">
          <ShieldCheck size={15} className="text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-emerald-300/80 font-medium">
            Actively moderated · Community guidelines enforced · Safe for all members
          </span>
          <span className="ml-auto text-[10px] text-emerald-500/60 hidden sm:block">
            You can leave at any time
          </span>
        </div>

        {/* ── HEADER ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-7">
          <div className="flex-1 min-w-0">

            {/* Badges row */}
            <div className="flex items-center flex-wrap gap-2 mb-4">
              <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${level.bg} ${level.text} ${level.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${level.dot}`} />
                {room.level}
              </span>
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-400">
                <Globe2 size={12} /> {room.language}
              </span>
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-400">
                <Users size={12} /> {room.members.length}/{room.maxParticipants}
              </span>
              {/* Live badge */}
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                </span>
                Live
              </span>
              {/* Locked indicator placeholder */}
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-gray-600">
                <Lock size={11} /> Open
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">{room.title}</h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-lg">{room.description}</p>

            <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-600">
              <Hash size={11} />
              <span className="font-mono">{room.id}</span>
            </div>
          </div>

          {/* ── JOIN CTA ──────────────────────────────────────── */}
          <div className="flex flex-col gap-2 sm:items-end flex-shrink-0">
            <button
              className={`group flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
                isLoading
                  ? "bg-green-500/50 text-white/70 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
              }`}
              disabled={isLoading}
              onClick={joinRoomHandler}
            >
              <DoorOpen size={18} className={isLoading ? "" : "group-hover:translate-x-0.5 transition-transform duration-200"} />
              {isLoading ? "Joining…" : "Join Room"}
            </button>
            {spotsLeft > 0 && !isLoading && (
              <span className="text-xs text-gray-500">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining</span>
            )}
          </div>
        </div>

        {/* ── HOST TRUST CARD ───────────────────────────────── */}
        {/* Key safety signal: users need to know who they're entering a room with */}
        {hostMember && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 mb-6 flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <Image
                src={hostMember.avatar ?? ""}
                alt={hostMember.name}
                width={52}
                height={52}
                className="w-13 h-13 rounded-full object-cover border-2 border-amber-500/30"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#141414] border border-amber-500/40 flex items-center justify-center">
                <Crown size={10} className="text-amber-400" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white text-sm font-semibold">{hostMember.name}</span>
                {/* Verified badge */}
                {mockHostMeta.isVerified && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
                    <BadgeCheck size={10} /> Verified Host
                  </span>
                )}
                {/* Trusted badge */}
                {mockHostMeta.isTrusted && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                    <ShieldCheck size={10} /> Trusted
                  </span>
                )}
              </div>

              {/* Host stats row — future-ready */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Star size={11} className="text-amber-400/70" />
                  {mockHostMeta.hostRating} rating
                </span>
                <span className="text-gray-700">·</span>
                <span className="text-xs text-gray-500">
                  {mockHostMeta.sessionsHosted} sessions hosted
                </span>
                <span className="text-gray-700">·</span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={10} />
                  Member since {mockHostMeta.memberSince}
                </span>
              </div>
            </div>

            {/* Future: AI-generated host insight placeholder */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-gray-600 flex-shrink-0">
              <Sparkles size={11} className="text-purple-400/50" />
              <span>AI insights soon</span>
            </div>
          </div>
        )}

        {/* ── PARTICIPANTS ──────────────────────────────────── */}
        <div className="border-t border-white/[0.06] pt-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Participants</h2>
            <span className="text-xs text-gray-500 bg-white/[0.05] border border-white/[0.07] px-2.5 py-1 rounded-full">
              {room.members.length} / {room.maxParticipants}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room.members.map((member) => {
              const isHost = member.id === room.hostId;
              const isModerator = MOCK_MODERATOR_IDS.includes(member.id);

              return (
                <div
                  key={member.id}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.10] hover:bg-white/[0.05] transition-all duration-200"
                >
                  <div className="relative flex-shrink-0">
                    <Image
                      src={member.avatar ?? ""}
                      alt={member.name}
                      width={44}
                      height={44}
                      className={`w-11 h-11 rounded-full object-cover border-2 ${
                        isHost ? "border-amber-500/40" : isModerator ? "border-blue-500/30" : "border-white/10"
                      }`}
                    />
                    {/* Presence dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#121212] bg-green-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-white text-sm truncate">{member.name}</span>
                      {isHost && <Crown size={12} className="text-amber-400 flex-shrink-0" />}
                      {isModerator && !isHost && (
                        <ShieldCheck size={12} className="text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mic size={11} className="text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {isHost ? "Host" : isModerator ? "Moderator" : "Member"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: room.maxParticipants - room.members.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/[0.06]"
              >
                <div className="w-11 h-11 rounded-full border border-dashed border-white/[0.08] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/[0.08]" />
                </div>
                <span className="text-xs text-gray-600">Open slot</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER ────────────────────────────────────────── */}
        <div className="border-t border-white/[0.06] pt-5 flex items-center justify-between gap-4">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] text-gray-400 text-sm hover:border-white/[0.15] hover:text-white hover:bg-white/[0.03] transition-all duration-200 active:scale-95"
          >
            <ArrowLeft size={16} />
            Back to rooms
          </button>

          <p className="text-xs text-gray-600 hidden sm:block">
            By joining you agree to our{" "}
            <span className="text-gray-500 underline underline-offset-2 cursor-pointer hover:text-white transition-colors">
              community guidelines
            </span>
          </p>
        </div>
      </div>
    </Modal>
  );
}