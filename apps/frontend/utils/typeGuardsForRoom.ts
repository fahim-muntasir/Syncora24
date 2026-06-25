import { RoomsResponseType, RoomType, RoomMember, RoomResponseType } from "@/types/room";

export function isRoomsResponse(obj: unknown): obj is RoomsResponseType {
  if (typeof obj === "object" && obj !== null) {
    const response = obj as Record<string, unknown>;

    return (
      typeof response.code === "number" &&
      Array.isArray(response.data) &&
      response.data.every(isRoomType) &&
      typeof response.links === "object" &&
      response.links !== null &&
      typeof (response.links as Record<string, unknown>).self === "string" &&
      typeof response.message === "string" &&
      typeof response.success === "boolean"
    );
  }
  return false;
}

export function isRoomResponse(obj: unknown): obj is RoomResponseType {
  if (typeof obj === "object" && obj !== null) {
    const response = obj as Record<string, unknown>;

    return (
      typeof response.code === "number" &&
      typeof response.data === "object" &&
      response.data !== null &&
      isRoomType(response.data) &&
      typeof response.links === "object" &&
      // response.links !== null &&
      // typeof (response.links as Record<string, unknown>).self === "string" &&
      typeof response.message === "string" &&
      typeof response.success === "boolean"
    );
  }
  return false;
}

function isRoomType(room: unknown): room is RoomType {
  if (typeof room === "object" && room !== null) {
    const r = room as Record<string, unknown>;

    return (
      typeof r.id === "string" &&
      typeof r.title === "string" &&
      typeof r.hostId === "string" &&
      typeof r.description === "string" &&
      typeof r.language === "string" &&
      typeof r.level === "string" &&
      typeof r.maxParticipants === "number" &&
      Array.isArray(r.members) &&
      r.members.every(isRoomMember) &&
      typeof r.status === "string" &&
      ["active", "full", "ended"].includes(r.status) &&
      typeof r.createdAt === "string"
    );
  }
  return false;
}

function isRoomMember(member: unknown): member is RoomMember {
  if (typeof member === "object" && member !== null) {
    const m = member as Record<string, unknown>;

    return (
      typeof m.id === "string" &&
      typeof m.name === "string" &&
      (typeof m.avatar === "undefined" || typeof m.avatar === "string")
    );
  }
  return false;
}
