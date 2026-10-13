import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Modal from "../../common/Modal";
import {
  Users,
  Globe2,
  Crown,
  DoorOpen,
  ArrowLeft,
  ShieldCheck,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Check,
  MessageCircle,
  Scale,
} from "lucide-react";
import { useGetSingleRoomQuery, roomApiSlice } from "@/libs/features/room/roomApiSlice";
import { useAppSelector, useAppDispatch } from "@/libs/hooks";
import { publicSocketManager } from "@/libs/socket/index";
import { generateIdenticonAvatar } from "@/utils/generateAvatar";
import { RoomType } from "@/types/room";
import { BackgroundPattern } from "@/components/background/BackgroundPattern";
import LevelMeter from "@/components/common/Room/LevelMeter";

const MAX_EMPTY_SLOTS = 6;

function Divider() {
  return (
    <span
      aria-hidden="true"
      className="hidden h-3 w-px shrink-0 bg-white/10 sm:block"
    />
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  joinRoom: (side?: "for" | "against") => Promise<void>;
  onKicked: () => void;
}

export default function RoomDetailsModal({
  isOpen,
  onClose,
  joinRoom,
  onKicked,
}: Props) {
  const [isJoining, setIsJoining] = useState(false);
  const [selectedSide, setSelectedSide] = useState<"for" | "against" | "">("");
  const currentUser = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const { id } = useParams();
  const roomId = Array.isArray(id) ? id[0] : id;
  const {
    data: roomResponse,
    isLoading: isRoomLoading,
    isFetching,
    refetch,
  } = useGetSingleRoomQuery(roomId || "", { skip: !roomId });

  const roomData = roomResponse?.data;
  const isDebateRoom = roomData?.type === "debate";
  const currentMember = roomData?.members.find(
    (member) => member.id === currentUser?.id,
  );
  const spotsLeft = (roomData?.maxParticipants ?? 0) - (roomData?.members?.length ?? 0);
  const dispatch = useAppDispatch();
  const moderatorIds = useAppSelector((state) => state.room.moderatorIds);

  useEffect(() => {
    if (isDebateRoom && currentMember?.side) {
      setSelectedSide((previous) => previous || currentMember.side || "");
    }
  }, [currentMember?.side, isDebateRoom]);

  useEffect(() => {
    const unsubJoined = publicSocketManager.on(
      "public-room-member-joined",
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
        void refetch();
      }
    );

    return () => {
      unsubJoined?.();
    };
  }, [dispatch, refetch, roomId]);

  useEffect(() => {
    const unsubscribe = publicSocketManager.on(
      "public-room-member-side-updated",
      (payload: unknown) => {
        const event = payload as {
          roomId: string;
          memberId: string;
          side: "for" | "against";
        };
        if (event.roomId !== roomId) return;
        dispatch(
          roomApiSlice.util.updateQueryData(
            "getSingleRoom",
            roomId,
            (draft) => {
              const member = draft.data.members.find(
                (item) => item.id === event.memberId,
              );
              if (member) member.side = event.side;
            },
          ),
        );
      },
    );
    return unsubscribe;
  }, [dispatch, roomId]);

  useEffect(() => {
    const unsubRemoved = publicSocketManager.on(
      "public-room-member-removed",
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
        void refetch();
      }
    );

    return () => {
      unsubRemoved?.();
    };
  }, [dispatch, refetch, roomId]);

  const joinRoomHandler = async () => {
    if (!roomId) {
      toast.error("Room ID is missing.");
      return;
    }

    if (!currentUser?.id) {
      toast.error("User not authenticated.");
      return;
    }

    setIsJoining(true);

    const toastId = toast.loading("Joining room…");

    try {
      await joinRoom(isDebateRoom ? selectedSide || undefined : undefined);

      toast.success(
        "You joined the room!",
        { id: toastId },
      );

      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to join room.";

      const isMemberKicked =
        error instanceof Error &&
        "code" in error &&
        error.code === "MEMBER_KICKED";

      if (isMemberKicked) {
        onKicked();
      } else {
        console.error("Join room failed:", error);
      }

      toast.error(message, {
        id: toastId,
      });
    } finally {
      setIsJoining(false);
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

  const needsSide = isDebateRoom && !selectedSide;
  const joinDisabled = isJoining || needsSide;
  const TypeIcon = isDebateRoom ? Scale : MessageCircle;

  const memberCount = roomData?.members?.length ?? 0;
  const maxParticipants = roomData?.maxParticipants ?? 0;
  const emptySlotCount = Math.max(0, maxParticipants - memberCount);
  const visibleEmptySlots = Math.min(emptySlotCount, MAX_EMPTY_SLOTS);
  const hiddenEmptySlots = emptySlotCount - visibleEmptySlots;

  const sideOptions = [
    {
      value: "for" as const,
      label: "For",
      hint: "I agree with this topic",
      Icon: ThumbsUp,
      active: "border-emerald-400/50 bg-emerald-500/[0.08]",
      iconActive: "bg-emerald-500/20 text-emerald-300",
      labelActive: "text-emerald-300",
    },
    {
      value: "against" as const,
      label: "Against",
      hint: "I disagree with this topic",
      Icon: ThumbsDown,
      active: "border-rose-400/50 bg-rose-500/[0.08]",
      iconActive: "bg-rose-500/20 text-rose-300",
      labelActive: "text-rose-300",
    },
  ];

  const focusRing =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60";

  return (
    <Modal backdrop={<BackgroundPattern />}>
      <div className="flex max-h-[90dvh] min-h-0 flex-col">

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent sm:p-8">

          <header className="mb-6 sm:mb-7">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400 sm:gap-x-2.5">
              <LevelMeter level={roomData?.level} />
              <Divider />
              <span className="flex min-w-0 items-center gap-1.5">
                <Globe2 size={12} className="shrink-0 text-gray-500" />
                <span className="truncate">{roomData?.language}</span>
              </span>
              <Divider />
              <span className="flex items-center gap-1.5 text-gray-500">
                <TypeIcon size={12} className="shrink-0" />
                {isDebateRoom ? "Debate" : "Open conversation"}
              </span>
            </div>

            <h1 className="mt-3 break-words text-xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
              {roomData?.title}
            </h1>
            {roomData?.description && (
              <p className="mt-2 max-w-xl whitespace-pre-line break-words text-sm leading-relaxed text-gray-400">
                {roomData.description}
              </p>
            )}
          </header>

          {/* Debate side picker */}
          {isDebateRoom && (
            <fieldset className="mb-6 rounded-xl border border-white/[0.07] bg-[#141414]/60 p-3 sm:mb-7 sm:p-4">
              <legend className="sr-only">Choose your position</legend>

              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Choose your position
              </p>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                {sideOptions.map(({ value, label, hint, Icon, active, iconActive, labelActive }) => {
                  const isSelected = selectedSide === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={Boolean(currentMember?.side)}
                      onClick={() => setSelectedSide(value)}
                      className={`group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:p-3.5 ${focusRing} ${isSelected
                        ? active
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.04]"
                        }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors motion-reduce:transition-none ${isSelected
                          ? iconActive
                          : "bg-white/[0.05] text-gray-400 group-hover:text-white"
                          }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm font-semibold ${isSelected ? labelActive : "text-white"
                            }`}
                        >
                          {label}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">{hint}</span>
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors motion-reduce:transition-none ${isSelected
                          ? "border-transparent bg-white text-black"
                          : "border-white/15 text-transparent"
                          }`}
                        aria-hidden="true"
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Participants */}
          <section
            aria-label="Participants"
            className="border-t border-white/[0.06] pt-5 sm:pt-6"
          >
            <div className="mb-3.5 flex items-center justify-between gap-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Participants
              </h2>

              {isRoomLoading || isFetching ? (
                <div className="h-4 w-12 animate-pulse rounded bg-white/[0.06]" />
              ) : (
                <span
                  className="flex items-center gap-1.5 text-xs tabular-nums text-gray-400"
                  aria-label={`${memberCount} of ${maxParticipants} participants`}
                >
                  <Users size={12} className="text-gray-500" />
                  {memberCount}/{maxParticipants}
                </span>
              )}
            </div>

            {isRoomLoading ? (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
                  >
                    <div className="h-11 w-11 animate-pulse rounded-xl bg-white/[0.06]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
                      <div className="h-2.5 w-16 animate-pulse rounded bg-white/[0.04]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                {roomData?.members?.map((member) => {
                  const isHost = member.id === roomData?.hostId;
                  const isModerator = moderatorIds.includes(member.id);

                  const avatarSvg =
                    member.avatar ||
                    generateIdenticonAvatar(member.name, 60);

                  return (
                    <div
                      key={member.id}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-[#141414]/50 p-2.5 transition-colors duration-200 hover:border-white/[0.14] motion-reduce:transition-none sm:p-3"
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: avatarSvg }}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${isHost
                          ? "border-amber-500/40"
                          : isModerator
                            ? "border-blue-500/30"
                            : "border-white/[0.08]"
                          }`}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-white">
                            {member.name}
                          </span>
                          {isHost && (
                            <Crown size={12} className="shrink-0 text-amber-400" />
                          )}
                          {isModerator && !isHost && (
                            <ShieldCheck size={12} className="shrink-0 text-blue-400" />
                          )}
                        </div>

                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                          <span>
                            {isHost ? "Host" : isModerator ? "Moderator" : "Member"}
                          </span>
                          {isDebateRoom && member.side && (
                            <>
                              <span
                                aria-hidden="true"
                                className="h-3 w-px shrink-0 bg-white/10"
                              />
                              <span
                                className={`font-medium ${member.side === "for"
                                  ? "text-emerald-300"
                                  : "text-rose-300"
                                  }`}
                              >
                                {member.side === "for" ? "For" : "Against"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {Array.from({ length: visibleEmptySlots }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    aria-hidden="true"
                    className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-dashed border-white/[0.08] bg-white/[0.015] p-2.5 sm:p-3"
                  >
                    <div
                      className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.035] to-transparent motion-reduce:animate-none"
                      style={{ animationDelay: `${i * 250}ms` }}
                    />

                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/[0.08]">
                      <div className="h-2 w-2 rounded-full bg-emerald-400/60 shadow-[0_0_8px_rgba(52,211,153,0.25)] animate-pulse motion-reduce:animate-none" />
                    </div>

                    <div className="relative flex flex-col gap-1">
                      <span className="text-xs text-gray-400 truncate">
                        Open slot
                      </span>
                    </div>
                  </div>
                ))}


                {hiddenEmptySlots > 0 && (
                  <p className="px-1 text-xs text-gray-600 sm:col-span-2">
                    +{hiddenEmptySlots} more open slot{hiddenEmptySlots !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Room ID + guidelines */}
          <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.06] pt-4 text-xs text-gray-600 sm:mt-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-1">
              <button
                type="button"
                onClick={handleCopyRoomId}
                disabled={!roomData?.id}
                className={`shrink-0 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${focusRing}`}
                title="Copy Room ID"
                aria-label="Copy Room ID"
              >
                <Copy size={13} />
              </button>
              <span className="truncate font-mono">{roomData?.id}</span>
            </div>

            <p>
              By joining you agree to our{" "}
              <span className="cursor-pointer text-gray-500 underline underline-offset-2 transition-colors hover:text-white motion-reduce:transition-none">
                community guidelines
              </span>
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t border-white/[0.06] bg-[#141414] rounded-b-2xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-8 sm:pb-5 sm:pt-4">
          {needsSide && !isJoining && (
            <p className="mb-2 text-xs text-amber-400/80 sm:text-right">
              Choose a side to join
            </p>
          )}

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleBackToHome}
              aria-label="Back to rooms"
              className={`flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-3.5 py-2.5 text-sm text-gray-400 transition-colors hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-white active:scale-[0.98] motion-reduce:transition-none sm:px-4 ${focusRing}`}
            >
              <ArrowLeft size={16} />
              <span className="hidden min-[380px]:inline">Back to rooms</span>
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
              {!needsSide && !isJoining && spotsLeft > 0 && (
                <span className="hidden whitespace-nowrap text-xs text-gray-500 sm:inline">
                  {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining
                </span>
              )}

              <button
                type="button"
                disabled={joinDisabled}
                onClick={joinRoomHandler}
                className={`group flex flex-1 items-center justify-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors duration-200 active:scale-[0.98] motion-reduce:transition-none sm:flex-none sm:px-6 sm:py-3 ${focusRing} ${joinDisabled
                  ? "cursor-not-allowed bg-green-500/40 text-white/60"
                  : "bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-400"
                  }`}
              >
                <DoorOpen
                  size={18}
                  className={
                    isJoining
                      ? ""
                      : "transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  }
                />
                {isJoining ? "Joining…" : "Join Room"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}