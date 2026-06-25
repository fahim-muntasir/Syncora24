import { apiSlice } from "../api/apiSlice";
// import { CreateRoomType } from "@/types/roomCreateModal";

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createChat: builder.mutation<unknown, {roomId: string, msg: string}>({
      query: (body) => ({
        url: `/rooms/${body.roomId}/chat`,
        method: "POST",
        body: { msg: body.msg },
      }),
    }),
  }),
});

export const {
  useCreateChatMutation,
} = chatApiSlice;
