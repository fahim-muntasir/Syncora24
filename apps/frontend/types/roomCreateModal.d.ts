export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Native';

export type InitialValues = {
  title: string;
  description: string;
  language: string;
  level: ProficiencyLevel;
  maxParticipants: number;
  type: "open" | "debate";
};

export type CreateRoomModalProps = {
  isOpen: boolean;
};

export type CreateRoomType = InitialValues;