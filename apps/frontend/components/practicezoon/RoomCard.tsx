import React, { forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Globe2, ArrowRight, Mic } from 'lucide-react';
import { RoomType } from '@/types/room';
import { generateIdenticonAvatar } from '@/utils/generateAvatar';
import Image from 'next/image';

type RoomCardProps = {
  room: RoomType;
};

export const RoomCard = forwardRef<HTMLDivElement, RoomCardProps>(({ room }, ref) => {
  const router = useRouter();

  const levelConfig: Record<string, { bg: string; text: string; border: string; dot: string }> = {
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

  const level = levelConfig[room.level] ?? levelConfig.Beginner;

  const isUnlimited = room.maxParticipants === 0 || room.maxParticipants === Infinity;
  const maxGridCols = isUnlimited ? 5 : room.maxParticipants > 5 ? 5 : room.maxParticipants;

  const gridColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  };
  const gridColsClass: string = gridColsMap[maxGridCols] ?? 'grid-cols-1';

  const getSizeClasses = () => {
    if (room.maxParticipants < 5) {
      if (room.maxParticipants === 4) return 'w-[72px] h-[72px]';
      if (room.maxParticipants === 3) return 'w-[90px] h-[90px]';
      if (room.maxParticipants <= 2) return 'w-[100px] h-[100px]';
    }
    return 'w-12 h-12';
  };

  const isActive = room.members.length > 0;
  const isFull = !isUnlimited && room.members.length >= room.maxParticipants;

  const handleRoomClick = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  return (
    <div
      ref={ref}
      className="group relative bg-[#161616] border border-white/[0.07] rounded-2xl p-5 transition-all duration-300 flex flex-col gap-5 cursor-pointer hover:border-white/[0.14] hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/40"
      onClick={() => handleRoomClick(room.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleRoomClick(room.id)}
    >
      {/* Subtle hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top left, rgba(34,197,94,0.04) 0%, transparent 60%)',
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            {/* Level badge */}
            <span
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${level.bg} ${level.text} ${level.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${level.dot}`} />
              {room.level}
            </span>

            {/* Language badge */}
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-400">
              <Globe2 size={11} />
              {room.language}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-white text-sm font-medium leading-snug line-clamp-2 group-hover:text-white transition-colors duration-200">
            {room.title}
          </h3>
        </div>

        {/* Participant count + live indicator */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users size={12} />
            <span>{room.members.length}/{isUnlimited ? '∞' : room.maxParticipants}</span>
          </div>
          {isActive && (
            <div className="flex items-center gap-1 text-[10px] text-green-400 font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
              </span>
              Live
            </div>
          )}
          {isFull && (
            <span className="text-[10px] text-orange-400 font-medium bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
              Full
            </span>
          )}
        </div>
      </div>

      {/* Members grid */}
      <div
        className={`grid w-max ${gridColsClass} gap-2.5 ${
          room.maxParticipants < 3 ? 'justify-start' : 'justify-between'
        } mx-auto`}
      >
        {isUnlimited ? (
          room.members.map((member) => (
            <div key={member.id} className="relative group/avatar">
              <Image
                src={member.avatar || ''}
                alt={member.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-md group-hover/avatar:scale-110 group-hover/avatar:border-green-500/40 transition-all duration-200"
              />
              {/* Speaking indicator placeholder */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#161616] flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-[10px] text-white rounded-md opacity-0 group-hover/avatar:opacity-100 transition-all whitespace-nowrap z-10 pointer-events-none">
                {member.name}
              </div>
            </div>
          ))
        ) : (
          Array.from({ length: room.maxParticipants }).map((_, index) => {
            const member = room.members[index];
            const avatarSvg = member?.avatar || (member ? generateIdenticonAvatar(member.name, 150) : null);

            return (
              <div key={index} className="relative group/avatar">
                {member ? (
                  <>
                    {member.avatar ? (
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        width={56}
                        height={56}
                        className={`${getSizeClasses()} rounded-full object-cover border-2 border-white/10 shadow-md group-hover/avatar:scale-110 group-hover/avatar:border-green-500/30 transition-all duration-200`}
                      />
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{ __html: avatarSvg! }}
                        className={`${getSizeClasses()} rounded-full border-2 border-dashed border-white/10 shadow-md flex items-center justify-center group-hover/avatar:scale-110 group-hover/avatar:border-green-500/30 overflow-hidden transition-all duration-200`}
                      />
                    )}
                    <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-[10px] text-white rounded-md opacity-0 group-hover/avatar:opacity-100 transition-all whitespace-nowrap z-10 pointer-events-none">
                      {member.name}
                    </div>
                  </>
                ) : (
                  <div
                    className={`${getSizeClasses()} rounded-full border border-dashed border-white/[0.08] flex items-center justify-center`}
                  >
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CTA footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
          <Mic size={11} />
          <span>Voice room</span>
        </div>
        <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium group-hover:gap-2.5 transition-all duration-200">
          Join room
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-200" />
        </div>
      </div>
    </div>
  );
});

RoomCard.displayName = 'RoomCard';