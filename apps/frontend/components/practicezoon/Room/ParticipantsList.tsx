import React from 'react'
import { RoomType } from '@/types/room'
import { Crown } from 'lucide-react';
import Image from 'next/image';
import { generateIdenticonAvatar } from '@/utils/generateAvatar';

export default function ParticipantsList({ room }: { room: RoomType }) {

  return (
    <div className="p-4 space-y-2">
      {room.members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
        >
          <div className="relative">

            {member.avatar ? (
              <Image
                src={member.avatar}
                width={40}
                height={40}
                alt={member.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: generateIdenticonAvatar(member.name, 40) }}
                className="w-10 h-10 rounded-full flex items-center justify-center"
              />
            )}
            {member.id === room.hostId && (
              <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                <Crown size={12} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="text-white text-sm font-medium flex items-center gap-2">
              {member.name}
            </p>
            <p className="text-gray-400 text-xs">
              proficiency Level
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
