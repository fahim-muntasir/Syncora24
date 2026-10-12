import React from "react";
import {
  AlertTriangle,
  DoorOpen,
  Mic,
  MicOff,
  MonitorOff,
  MonitorUp,
  ShieldCheck,
  ShieldOff,
  UserPlus,
  UserX,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RoomActivity } from "@/types/chat";

const tones = {
  good: "text-emerald-400/80",
  neutral: "text-gray-500",
  warn: "text-amber-400/80",
  bad: "text-red-400/80",
};

type ActivityConfig = { icon: React.ReactNode; iconColor: string };

const cfg = (Icon: LucideIcon, tone: keyof typeof tones): ActivityConfig => ({
  icon: <Icon size={13} strokeWidth={1.8} />,
  iconColor: tones[tone],
});

function getActivityConfig(activity: RoomActivity): ActivityConfig {
  switch (activity.type) {
    case "member-joined":
      return cfg(UserPlus, "good");
    case "member-side-changed":
      return cfg(UserPlus, "neutral");
    case "member-left":
      return cfg(DoorOpen, "neutral");
    case "member-kicked":
      return cfg(UserX, "bad");
    case "member-muted":
      return cfg(MicOff, "warn");
    case "member-unmuted":
      return cfg(Mic, "good");
    case "mute-all-enabled":
      return cfg(VolumeX, "warn");
    case "mute-all-disabled":
      return cfg(Volume2, "neutral");
    case "moderator-promoted":
      return cfg(ShieldCheck, "good");
    case "moderator-removed":
      return cfg(ShieldOff, "neutral");
    case "room-ended":
      return cfg(AlertTriangle, "bad");
    case "camera-started":
      return cfg(Video, "good");
    case "camera-stopped":
      return cfg(VideoOff, "neutral");
    case "microphone-started":
      return cfg(Mic, "good");
    case "microphone-stopped":
      return cfg(MicOff, "neutral");
    case "screen-share-started":
      return cfg(MonitorUp, "good");
    case "screen-share-stopped":
      return cfg(MonitorOff, "neutral");
    case "camera-permission-changed":
      return cfg(activity.enabled ? Video : VideoOff, activity.enabled ? "good" : "warn");
  }
}

const Name = ({ children }: { children: React.ReactNode }) => (
  <span className="font-medium text-gray-300">{children}</span>
);

const Side = ({ side }: { side: "for" | "against" }) => (
  <span className={side === "for" ? "text-emerald-300" : "text-rose-300"}>
    {side === "for" ? "For" : "Against"}
  </span>
);

function renderActivityText(activity: RoomActivity): React.ReactNode {
  switch (activity.type) {
    case "member-joined":
      return (
        <>
          <Name>{activity.userName}</Name> joined the room
          {activity.side && (
            <>
              {" "}for <Side side={activity.side} />
            </>
          )}
        </>
      );
    case "member-side-changed":
      return (
        <>
          <Name>{activity.userName}</Name> changed their position to{" "}
          <Side side={activity.side} />
        </>
      );
    case "member-left":
      return (
        <>
          <Name>{activity.userName}</Name> left the room
        </>
      );
    case "member-kicked":
      return (
        <>
          <Name>{activity.userName}</Name> was removed by <Name>{activity.actorName}</Name>
        </>
      );
    case "member-muted":
      return (
        <>
          <Name>{activity.userName}</Name> was muted by <Name>{activity.actorName}</Name>
        </>
      );
    case "member-unmuted":
      return (
        <>
          <Name>{activity.userName}</Name> was unmuted by <Name>{activity.actorName}</Name>
        </>
      );
    case "mute-all-enabled":
      return (
        <>
          <Name>{activity.actorName}</Name> muted everyone
        </>
      );
    case "mute-all-disabled":
      return (
        <>
          <Name>{activity.actorName}</Name> unmuted everyone
        </>
      );
    case "moderator-promoted":
      return (
        <>
          <Name>{activity.userName}</Name> is now a moderator
        </>
      );
    case "moderator-removed":
      return (
        <>
          <Name>{activity.userName}</Name> is no longer a moderator
        </>
      );
    case "room-ended":
      return (
        <>
          <Name>{activity.actorName}</Name> ended the room
        </>
      );
    case "camera-started":
      return (
        <>
          <Name>{activity.userName}</Name> started their camera
        </>
      );
    case "camera-stopped":
      return (
        <>
          <Name>{activity.userName}</Name> stopped their camera
        </>
      );
    case "microphone-started":
      return (
        <>
          <Name>{activity.userName}</Name> turned on their microphone
        </>
      );
    case "microphone-stopped":
      return (
        <>
          <Name>{activity.userName}</Name> turned off their microphone
        </>
      );
    case "screen-share-started":
      return (
        <>
          <Name>{activity.userName}</Name> started sharing their screen
        </>
      );
    case "screen-share-stopped":
      return (
        <>
          <Name>{activity.userName}</Name> stopped sharing their screen
        </>
      );
    case "camera-permission-changed":
      return (
        <>
          <Name>{activity.actorName}</Name> {activity.enabled ? "enabled" : "disabled"} camera
          access for <Name>{activity.scope === "room" ? "the room" : activity.userName}</Name>
        </>
      );
  }
}

export default function ActivityMessage({ activity }: { activity: RoomActivity }) {
  const config = getActivityConfig(activity);

  return (
    <div className="flex items-center gap-2 px-1 py-0.5">
      <div className={`flex shrink-0 items-center justify-center ${config.iconColor}`}>
        {config.icon}
      </div>
      <p className="flex-1 text-[11px] font-normal leading-5 text-gray-500">
        {renderActivityText(activity)}
      </p>
      <time
        dateTime={new Date(activity.timestamp).toISOString()}
        className="shrink-0 text-[10px] tabular-nums text-gray-600"
      >
        {new Date(activity.timestamp).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
      </time>
    </div>
  );
}