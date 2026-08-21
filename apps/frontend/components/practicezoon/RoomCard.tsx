import React, { forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Globe2, ArrowRight, Mic } from 'lucide-react';
import { RoomType } from '@/types/room';
import { generateIdenticonAvatar } from '@/utils/generateAvatar';
import Image from 'next/image';

type RoomCardProps = {
  room: RoomType;
};

export const RoomCard = forwardRef<HTMLDivElement, RoomCardProps>(
  ({ room }, ref) => {
    const router = useRouter();

    const levelConfig: Record<
      string,
      {
        bg: string;
        text: string;
        border: string;
        dot: string;
      }
    > = {
      Beginner: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-400',
      },
      Intermediate: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        dot: 'bg-amber-400',
      },
      Advanced: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/20',
        dot: 'bg-orange-400',
      },
      Native: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        dot: 'bg-blue-400',
      },
    };

    const level =
      levelConfig[room.level] ?? levelConfig.Beginner;

    const isUnlimited =
      room.maxParticipants === 0 ||
      room.maxParticipants === Infinity;

    const maxGridCols = isUnlimited
      ? 5
      : room.maxParticipants > 5
        ? 5
        : room.maxParticipants;

    const gridColsMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
    };

    const gridColsClass =
      gridColsMap[maxGridCols] ?? 'grid-cols-1';


    const getSizeClasses = () => {
      if (room.maxParticipants < 5) {
        if (room.maxParticipants === 4) {
          return 'w-[72px] h-[72px]';
        }

        if (room.maxParticipants === 3) {
          return 'w-[90px] h-[90px]';
        }

        if (room.maxParticipants <= 2) {
          return 'w-[100px] h-[100px]';
        }
      }

      return 'w-12 h-12';
    };

    const memberSize = getSizeClasses();

    const isEnded = room.status === 'ended';

    const isFull =
      !isUnlimited &&
      room.members.length >= room.maxParticipants;

    const handleRoomClick = (roomId: string) => {
      if (isEnded) return;

      router.push(`/room/${roomId}`);
    };

    return (
      <div
        ref={ref}
        className={`group relative h-[260px] bg-[#161616] border rounded-2xl p-5 transition-all duration-300 flex flex-col ${isEnded ? 'border-white/[0.04] opacity-60 cursor-not-allowed' : 'border-white/[0.07] cursor-pointer hover:border-white/[0.14] hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/40'
          }`}
        onClick={() => handleRoomClick(room.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isEnded) {
            handleRoomClick(room.id);
          }
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at top left, rgba(34,197,94,0.04) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 h-[58px] flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              <span
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${level.bg} ${level.text} ${level.border}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${level.dot}`}
                />

                {room.level}
              </span>

              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-400">
                <Globe2 size={11} />

                {room.language}
              </span>
            </div>

            <h3 className="text-white text-sm font-medium leading-snug line-clamp-2">
              {room.title}
            </h3>
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users size={12} />

              <span>
                {room.members.length}/
                {isUnlimited ? '∞' : room.maxParticipants}
              </span>
            </div>

            {isEnded ? (
              <span className="text-[10px] text-gray-500 font-medium bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">
                Ended
              </span>
            ) : (
              <>
                {isFull && (
                  <span className="text-[10px] text-orange-400 font-medium bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                    Full
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="relative z-10 h-[128px] w-full flex items-center justify-center">
          <div
            className={`grid w-max ${gridColsClass} gap-2.5`}
          >
            {isUnlimited ? (
              room.members.map((member) => {
                const avatarSvg =
                  member.avatar ||
                  generateIdenticonAvatar(
                    member.name,
                    150
                  );

                return (
                  <div
                    key={member.id}
                    className="relative group/avatar"
                  >
                    <div
                      className={`relative ${memberSize} rounded-xl overflow-hidden bg-white/[0.035] border
                        border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-200 group-hover/avatar:-translate-y-0.5   group-hover/avatar:border-white/[0.18] group-hover/avatar:shadow-[0_8px_24px_rgba(0,0,0,0.35)]
                      `}
                    >
                      {member.avatar ? (
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          fill
                          sizes="100px"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: avatarSvg,
                          }}
                          className="absolute inset-0 flex items-center justify-center overflow-hidden"
                        />
                      )}

                      {/* Bottom gradient */}
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                      {/* Status indicator */}
                      <div className="absolute right-1.5 bottom-1.5">
                        <div className="relative flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#161616]/90 border border-white/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        </div>
                      </div>
                    </div>

                    <div
                      className="
                        absolute
                        -bottom-8
                        left-1/2
                        -translate-x-1/2
                        px-2.5
                        py-1
                        bg-[#0c0c0c]
                        border
                        border-white/[0.08]
                        text-[10px]
                        text-gray-200
                        rounded-md
                        shadow-xl
                        opacity-0
                        translate-y-1
                        group-hover/avatar:opacity-100
                        group-hover/avatar:translate-y-0
                        transition-all
                        duration-150
                        whitespace-nowrap
                        z-20
                        pointer-events-none
                      "
                    >
                      {member.name}
                    </div>
                  </div>
                );
              })
            ) : (
              Array.from({
                length: room.maxParticipants,
              }).map((_, index) => {
                const member = room.members[index];

                const avatarSvg = member
                  ? member.avatar ||
                  generateIdenticonAvatar(
                    member.name,
                    150
                  )
                  : null;

                return (
                  <div
                    key={index}
                    className="relative group/avatar"
                  >
                    {member ? (
                      <>
                        {/* Member Tile */}
                        <div
                          className={`
                            relative
                            ${memberSize}
                            rounded-xl
                            overflow-hidden
                            bg-white/[0.035]
                            border
                            border-white/[0.08]
                            shadow-[0_4px_16px_rgba(0,0,0,0.25)]
                            transition-all
                            duration-200
                            group-hover/avatar:-translate-y-0.5
                            group-hover/avatar:border-white/[0.18]
                            group-hover/avatar:shadow-[0_8px_24px_rgba(0,0,0,0.35)]
                          `}
                        >
                          {member.avatar ? (
                            <Image
                              src={member.avatar}
                              alt={member.name}
                              fill
                              sizes="100px"
                              className="object-cover"
                            />
                          ) : (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: avatarSvg!,
                              }}
                              className="absolute inset-0 flex items-center justify-center overflow-hidden"
                            />
                          )}

                        </div>

                        {/* Name tooltip */}
                        <div
                          className="
                            absolute
                            -bottom-8
                            left-1/2
                            -translate-x-1/2
                            px-2.5
                            py-1
                            bg-[#0c0c0c]
                            border
                            border-white/[0.08]
                            text-[10px]
                            text-gray-200
                            rounded-md
                            shadow-xl
                            opacity-0
                            translate-y-1
                            group-hover/avatar:opacity-100
                            group-hover/avatar:translate-y-0
                            transition-all
                            duration-150
                            whitespace-nowrap
                            z-20
                            pointer-events-none
                          "
                        >
                          {member.name}
                        </div>
                      </>
                    ) : (
                      /* Empty Slot */
                      <div
                        className={`${memberSize} rounded-xl border border-dashed border-white/[0.07]  bg-white/[0.015] flex items-center justify-center transition-all duration-200  group-hover:border-white/[0.1]
                        `}
                      >
                        <div className="w-2 h-2 rounded-full bg-white/[0.08]" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="relative z-10 mt-auto flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
            <Mic size={11} />

            <span>
              {isEnded ? 'Room ended' : 'Voice room'}
            </span>
          </div>

          {isEnded ? (
            <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
              Room unavailable
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium group-hover:gap-2.5 transition-all duration-200">
              Join room

              <ArrowRight
                size={13}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);

RoomCard.displayName = 'RoomCard';