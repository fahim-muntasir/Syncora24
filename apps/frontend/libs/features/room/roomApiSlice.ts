import { apiSlice } from "../api/apiSlice";
import { CreateRoomType } from "@/types/roomCreateModal";
import { DebateSide, RoomResponseType } from "@/types/room";

export const roomApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRooms: builder.query<unknown, void>({
      query: () => `/rooms`,
    }),
    getSingleRoom: builder.query<RoomResponseType, string>({
      query: (roomId) => `/rooms/${roomId}`,
    }),
    createRoom: builder.mutation<unknown, CreateRoomType>({
      query: (body) => ({
        url: "/rooms",
        method: "POST",
        body: { ...body },
      }),
    }),
    addRoomMember: builder.mutation<
      unknown,
      string | { roomId: string; side?: DebateSide }
    >({
      query: (argument) => {
        const roomId =
          typeof argument === "string" ? argument : argument.roomId;
        const body =
          typeof argument === "string" ? undefined : { side: argument.side };

        return {
          url: `/rooms/${roomId}/members/add`,
          method: "POST",
          ...(body ? { body } : {}),
        };
      },
    }),
    removeRoomMember: builder.mutation<unknown, string>({
      query: (roomId) => ({
        url: `/rooms/${roomId}/members/remove`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useCreateRoomMutation,
  useGetRoomsQuery,
  useAddRoomMemberMutation,
  useGetSingleRoomQuery,
  useRemoveRoomMemberMutation,
} = roomApiSlice;
