export type Reaction = {
  emoji: string;
  users: string[];
};

export type Message = {
  id: number | string;
  sender: "user" | "other";
  name: string;
  text?: string;
  emojiOnly?: boolean;
  imageUrl?: string;
  gifUrl?: string;
  // replyTo?: number | string;
  replyTo?: {
    id: number | string;
    name: string;
    text?: string;
  };
  reactions: Reaction[];
  quiz?: {
    title: string;
    description: string;
    difficulty: string;
    category: string;
    participants: number;
    time: string;
    points: number;
  };
  quizResult?: {
    title: string;
    correct: number;
    total: number;
    score: number;
  };
};

export type IncomingMessage = {
  roomId: string;
  message: {
    text?: string;
    emojiOnly?: boolean;
    imageUrl?: string;
    gifUrl?: string;
    senderName: string;

    replyTo?: {
      id: number | string;
      name: string;
      text?: string;
    } | null;
  };
  senderId: string;
  timestamp: number;
};