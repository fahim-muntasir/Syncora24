import { apiSlice } from "../api/apiSlice";
import { CreateRoomType } from "@/types/roomCreateModal";

export const roomApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRooms: builder.query<unknown, void>({
      query: () => `/rooms`,
    }),
    getSingleRoom: builder.query<unknown, string>({
      query: (roomId) => `/rooms/${roomId}`,
    }),
    createRoom: builder.mutation<unknown, CreateRoomType>({
      query: (body) => ({
        url: "/rooms",
        method: "POST",
        body: { ...body },
      }),
    }),
    addRoomMember: builder.mutation<unknown, string>({
      query: (roomId) => ({
        url: `/rooms/${roomId}/members/add`,
        method: "POST",
      }),
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
