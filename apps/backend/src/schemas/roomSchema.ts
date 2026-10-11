import { z } from "zod";

export const roomSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  language: z.string().min(1, "Language is required"),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "Native"], {
    required_error: "Proficiency level is required",
  }),
  maxParticipants: z.number().min(1, "Must allow at least 1 participant"),
  type: z.enum(["open", "debate"]).default("open"),
  // status: z.enum(["active", "full", "ended"], {
  //   required_error: "Room status is required",
  // }),
});

export type RoomInputType = z.infer<typeof roomSchema>;

export const debateSideSchema = z.enum(["for", "against"]);
export const joinRoomSchema = z.object({
  side: debateSideSchema.optional(),
});
export const changeMemberSideSchema = z.object({
  roomId: z.string().min(1),
  side: debateSideSchema,
});
export type DebateSide = z.infer<typeof debateSideSchema>;

export const roomMemberSchema = z.object({
  name: z.string().min(1, "Member name is required"),
  avatar: z.string().url("Avatar must be a valid URL").optional(),
});

export type RoomMemberType = z.infer<typeof roomMemberSchema>;