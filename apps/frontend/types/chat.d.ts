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

export type RoomActivity =
  | {
      type: "member-joined";
      userId: string;
      userName: string;
      timestamp: number;
    }
  | { type: "member-left"; userId: string; userName: string; timestamp: number }
  | {
      type: "member-kicked";
      userId: string;
      userName: string;
      actorId: string;
      actorName: string;
      timestamp: number;
    }
  | {
      type: "member-muted";
      userId: string;
      userName: string;
      actorId: string;
      actorName: string;
      timestamp: number;
    }
  | {
      type: "member-unmuted";
      userId: string;
      userName: string;
      actorId: string;
      actorName: string;
      timestamp: number;
    }
  | {
      type: "mute-all-enabled";
      actorId: string;
      actorName: string;
      timestamp: number;
    }
  | {
      type: "mute-all-disabled";
      actorId: string;
      actorName: string;
      timestamp: number;
    }
  | {
      type: "moderator-promoted";
      userId: string;
      userName: string;
      actorId: string;
      actorName: string;
      timestamp: number;
    }
  | {
      type: "moderator-removed";
      userId: string;
      userName: string;
      actorId: string;
      actorName: string;
      timestamp: number;
    }
  | {
      type: "room-ended";
      actorId: string;
      actorName: string;
      timestamp: number;
    };

export type ChatItem =
  | {
      type: "message";
      id: number | string;
      message: Message;
      timestamp: number;
    }
  | {
      type: "activity";
      id: number | string;
      activity: RoomActivity;
      timestamp: number;
    };
