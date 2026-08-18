import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Modal from "../../common/Modal";
import {
  Users,
  Globe2,
  Crown,
  DoorOpen,
  ArrowLeft,
  Mic,
  Hash,
  ShieldCheck,
  Lock,
  Copy,
} from "lucide-react";
import { useAddRoomMemberMutation, useGetSingleRoomQuery, roomApiSlice } from "@/libs/features/room/roomApiSlice";
import { useAppSelector, useAppDispatch } from "@/libs/hooks";
import { socketManager } from "@/libs/socket/index";
import { generateIdenticonAvatar } from "@/utils/generateAvatar";
import { RoomType } from "@/types/room";

const levelConfig: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Beginner: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  Intermediate: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  Advanced: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", dot: "bg-orange-400" },
  Native: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
};

const MOCK_MODERATOR_IDS = ["2"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  joinRoom: () => Promise<void>;
}

export default function RoomDetailsModal({ 
  isOpen, 
  onClose, 
  joinRoom
}: Props) {
  const [addRoomMember, { isLoading }] = useAddRoomMemberMutation();
  const currentUser = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const { id } = useParams();
  const roomId = Array.isArray(id) ? id[0] : id;
  const { data: roomResponse } = useGetSingleRoomQuery(roomId || "", {
    skip: !roomId,
  });

  const roomData = roomResponse?.data;
  const level = levelConfig[roomData?.level as keyof typeof levelConfig] ?? levelConfig.Beginner;
  const spotsLeft = (roomData?.maxParticipants ?? 0) - (roomData?.members?.length ?? 0);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubJoined = socketManager.on(
      "joinedMember",
      (payload: unknown) => {
        const data = payload as {
          roomId: string;
          newMember: RoomType["members"][number];
        };

        if (data.roomId !== roomId) {
          return;
        }

        dispatch(
          roomApiSlice.util.updateQueryData(
            "getSingleRoom",
            roomId,
            (draft) => {
              const exists = draft.data.members.some(
                (member) => member.id === data.newMember.id
              );

              if (exists) {
                return;
              }

              draft.data.members.push(data.newMember);
            }
          )
        );
      }
    );

    return () => {
      unsubJoined?.();
    };
  }, [dispatch, roomId]);

  useEffect(() => {
    const unsubRemoved = socketManager.on(
      "removedMember",
      (payload: unknown) => {
        const data = payload as {
          roomId: string;
          memberId: string;
        };

        if (data.roomId !== roomId) {
          return;
        }

        dispatch(
          roomApiSlice.util.updateQueryData(
            "getSingleRoom",
            roomId,
            (draft) => {
              draft.data.members = draft.data.members.filter(
                (member) => member.id !== data.memberId
              );
            }
          )
        );
      }
    );

    return () => {
      unsubRemoved?.();
    };
  }, [dispatch, roomId]);

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

  const handleCopyRoomId = async () => {
    if (!roomData?.id) return;

    try {
      await navigator.clipboard.writeText(roomData.id);
      toast.success("Room ID copied!");
    } catch (error) {
      console.error("Failed to copy Room ID:", error);
      toast.error("Failed to copy Room ID");
    }
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  if (isOpen) return null;

  return (
    <Modal>
      <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15 mb-6">
          <ShieldCheck size={15} className="text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-emerald-300/80 font-medium">
            Actively moderated · Community guidelines enforced · Safe for all members
          </span>
          <span className="ml-auto text-[10px] text-emerald-500/60 hidden sm:block">
            You can leave at any time
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-7">
          <div className="flex-1 min-w-0">

            <div className="flex items-center flex-wrap gap-2 mb-4">
              <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${level.bg} ${level.text} ${level.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${level.dot}`} />
                {roomData?.level}
              </span>
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-400">
                <Globe2 size={12} /> {roomData?.language}
              </span>
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-400">
                <Users size={12} /> {roomData?.members.length}/{roomData?.maxParticipants}
              </span>

              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-gray-600">
                <Lock size={11} /> Open
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">{roomData?.title}</h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-lg">{roomData?.description}</p>

            <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
              <Hash size={11} />

              <span className="font-mono">
                {roomData?.id}
              </span>

              <button
                type="button"
                onClick={handleCopyRoomId}
                disabled={!roomData?.id}
                className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Copy Room ID"
                aria-label="Copy Room ID"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end flex-shrink-0">
            <button
              className={`group flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 ${isLoading
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

        <div className="border-t border-white/[0.06] pt-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Participants</h2>
            <span className="text-xs text-gray-500 bg-white/[0.05] border border-white/[0.07] px-2.5 py-1 rounded-full">
              {roomData?.members.length} / {roomData?.maxParticipants}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roomData?.members.map((member) => {
              const isHost = member.id === roomData?.hostId;
              const isModerator = MOCK_MODERATOR_IDS.includes(member.id);
              const avatarSvg = member.avatar || generateIdenticonAvatar(member.name, 60);

              return (
                <div
                  key={member.id}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.10] hover:bg-white/[0.05] transition-all duration-200"
                >
                  <div className="relative flex-shrink-0">
                    <div
                      dangerouslySetInnerHTML={{ __html: avatarSvg }}
                      className={`
                        rounded-full
                        overflow-hidden
                        border-2
                        transition-all
                        duration-300
                        flex
                        items-center
                        justify-center
                        ${isHost ? "border-amber-500/40" : isModerator ? "border-blue-500/30" : "border-white/10"}
                      `}
                      style={{ width: 44, height: 44 }}
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
            {Array.from({
              length: Math.max(
                0,
                (roomData?.maxParticipants ?? 0) - (roomData?.members?.length ?? 0)
              ),
            }).map((_, i) => (
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