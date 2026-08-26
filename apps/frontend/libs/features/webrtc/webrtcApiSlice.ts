import { apiSlice } from "../api/apiSlice";

interface IceServersResponse {
  success: boolean;
  data: RTCIceServer[];
}

export const webrtcApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getIceServers: builder.query<IceServersResponse, void>({
      query: () => "/webrtc/ice-servers",
    }),
  }),
});

export const {
  useLazyGetIceServersQuery,
} = webrtcApiSlice;