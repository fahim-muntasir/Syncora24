import {
  UserPlus,
  UserX,
  MicOff,
  Mic,
  ShieldCheck,
  ShieldOff,
  VolumeX,
  Volume2,
  DoorOpen,
  AlertTriangle,
} from "lucide-react";
import { RoomActivity } from "@/types/chat";

export default function ActivityMessage({
  activity,
}: {
  activity: RoomActivity;
}) {
  const config = getActivityConfig(activity);

  return (
    <div className="flex items-center gap-2 px-1 py-0.5">
      {/* Activity icon */}
      <div
        className={`flex items-center justify-center shrink-0 ${config.iconColor}`}
      >
        {config.icon}
      </div>

      {/* Activity text */}
      <p
        className={`text-[11px] leading-5 font-normal ${config.textColor}`}
      >
        {renderActivityText(activity)}
      </p>
    </div>
  );
}

type ActivityConfig = {
  icon: React.ReactNode;
  iconColor: string;
  textColor: string;
};

function getActivityConfig(
  activity: RoomActivity
): ActivityConfig {
  switch (activity.type) {
    case "member-joined":
      return {
        icon: <UserPlus size={13} strokeWidth={1.8} />,
        iconColor: "text-emerald-500/70",
        textColor: "text-gray-500",
      };

    case "member-left":
      return {
        icon: <DoorOpen size={13} strokeWidth={1.8} />,
        iconColor: "text-gray-500",
        textColor: "text-gray-500",
      };

    case "member-kicked":
      return {
        icon: <UserX size={13} strokeWidth={1.8} />,
        iconColor: "text-red-400/80",
        textColor: "text-gray-500",
      };

    case "member-muted":
      return {
        icon: <MicOff size={13} strokeWidth={1.8} />,
        iconColor: "text-amber-400/80",
        textColor: "text-gray-500",
      };

    case "member-unmuted":
      return {
        icon: <Mic size={13} strokeWidth={1.8} />,
        iconColor: "text-emerald-400/70",
        textColor: "text-gray-500",
      };

    case "mute-all-enabled":
      return {
        icon: <VolumeX size={13} strokeWidth={1.8} />,
        iconColor: "text-blue-400/75",
        textColor: "text-gray-500",
      };

    case "mute-all-disabled":
      return {
        icon: <Volume2 size={13} strokeWidth={1.8} />,
        iconColor: "text-gray-500",
        textColor: "text-gray-500",
      };

    case "moderator-promoted":
      return {
        icon: <ShieldCheck size={13} strokeWidth={1.8} />,
        iconColor: "text-violet-400/75",
        textColor: "text-gray-500",
      };

    case "moderator-removed":
      return {
        icon: <ShieldOff size={13} strokeWidth={1.8} />,
        iconColor: "text-gray-500",
        textColor: "text-gray-500",
      };

    case "room-ended":
      return {
        icon: <AlertTriangle size={13} strokeWidth={1.8} />,
        iconColor: "text-red-400/80",
        textColor: "text-gray-500",
      };
  }
}

function renderActivityText(
  activity: RoomActivity
): React.ReactNode {
  switch (activity.type) {
    case "member-joined":
      return (
        <>
          <span className="text-gray-400 font-medium">
            {activity.userName}
          </span>{" "}
          joined the room
        </>
      );

    case "member-left":
      return (
        <>
          <span className="text-gray-400 font-medium">
            {activity.userName}
          </span>{" "}
          left the room
        </>
      );

    case "member-kicked":
      return (
        <>
          <span className="text-red-400/80 font-medium">
            {activity.userName}
          </span>{" "}
          was kicked by{" "}
          <span className="text-gray-400 font-medium">
            {activity.actorName}
          </span>
        </>
      );

    case "member-muted":
      return (
        <>
          <span className="text-amber-400/80 font-medium">
            {activity.userName}
          </span>{" "}
          was muted by{" "}
          <span className="text-gray-400 font-medium">
            {activity.actorName}
          </span>
        </>
      );

    case "member-unmuted":
      return (
        <>
          <span className="text-emerald-400/70 font-medium">
            {activity.userName}
          </span>{" "}
          was unmuted by{" "}
          <span className="text-gray-400 font-medium">
            {activity.actorName}
          </span>
        </>
      );

    case "mute-all-enabled":
      return (
        <>
          <span className="text-gray-400 font-medium">
            {activity.actorName}
          </span>{" "}
          enabled mute all
        </>
      );

    case "mute-all-disabled":
      return (
        <>
          <span className="text-gray-400 font-medium">
            {activity.actorName}
          </span>{" "}
          disabled mute all
        </>
      );

    case "moderator-promoted":
      return (
        <>
          <span className="text-violet-400/80 font-medium">
            {activity.userName}
          </span>{" "}
          is now a moderator
        </>
      );

    case "moderator-removed":
      return (
        <>
          <span className="text-gray-400 font-medium">
            {activity.userName}
          </span>{" "}
          is no longer a moderator
        </>
      );

    case "room-ended":
      return (
        <>
          <span className="text-red-400/80 font-medium">
            {activity.actorName}
          </span>{" "}
          ended the room
        </>
      );
  }
}
