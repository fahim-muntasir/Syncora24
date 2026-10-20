import { apiSlice } from "../api/apiSlice";
import { isAuthResponse } from "@/utils/typeGuards";
import { userLoggedIn } from "./authSlice";
import type { AuthResponse } from "@/types/auth";

const getAuthenticatedUser = (data: unknown) => {
  if (!isAuthResponse(data)) {
    console.error("Invalid authentication response structure:", data);
    return null;
  }

  const auth = { token: data.data.token, user: data.data.user };
  localStorage.setItem("auth", JSON.stringify(auth));
  return auth;
};

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
          const auth = getAuthenticatedUser(data);
          if (auth) dispatch(userLoggedIn(auth));
        } catch {
          // The calling form displays the RTK Query error.
        }
      },
    }),

    googleSignIn: builder.mutation<unknown, { idToken: string }>({
      query: ({ idToken }) => ({
        url: "/auth/google",
        method: "POST",
        body: { idToken },
      }),
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          const auth = getAuthenticatedUser(data);
          if (auth) dispatch(userLoggedIn(auth));
        } catch {
          // The authentication modal displays the RTK Query error.
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
  useGoogleSignInMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
} = authApiSlice;
