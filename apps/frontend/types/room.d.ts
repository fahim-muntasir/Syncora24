export type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Japanese' | 'Korean' | 'Chinese';

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Native';

export type RoomMember = {
  id: string;
  name: string;
  avatar?: string;
  // proficiency: ProficiencyLevel;
  // isHost: boolean;
}

export type RoomType = {
  id: string;
  title: string;
  hostId: string;
  description: string;
  language: Language;
  level: ProficiencyLevel;
  maxParticipants: number;
  members: RoomMember[];
  status: 'active' | 'full' | 'ended';
  createdAt: string;
}

type BaseResponseType = {
  code: number;
  links: {
    self: string;
  };
  message: string;
  success: boolean;
};

export type RoomsResponseType = BaseResponseType & {
  data: RoomType[];
};

export type RoomResponseType = BaseResponseType & {
  data: RoomType;
};
