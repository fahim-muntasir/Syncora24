import { apiSlice } from "../api/apiSlice";
import { isAuthResponse } from "@/utils/typeGuards";
import { userLoggedIn } from "./authSlice";
import type { AuthResponse } from "@/types/auth";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    signUp: builder.mutation<
      unknown,
      { fullName: string; email: string; password: string }
    >({
      query: ({ fullName, email, password }) => ({
        url: "/auth/signup",
        method: "POST",
        body: { fullName, email, password },
      }),
    }),

    signIn: builder.mutation<unknown, { email: string; password: string }>({
      query: ({ email, password }) => ({
        url: "/auth/signin",
        method: "POST",
        body: { email, password },
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (isAuthResponse(data)) {
            localStorage.setItem(
              "auth",
              JSON.stringify({ token: data.data.token, user: data.data.user }),
            );

            dispatch(
              userLoggedIn({
                token: data.data.token,
                user: data.data.user,
              }),
            );

            setTimeout(() => {
              window.location.href = "/";
            }, 2000);
          } else {
            console.error("Invalid response structure:", data);
          }
        } catch (error) {
          console.error("Sign-in failed:", error);
        }
      },
    }),

    logout: builder.mutation<unknown, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useSignUpMutation,
  useSignInMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
} = authApiSlice;
