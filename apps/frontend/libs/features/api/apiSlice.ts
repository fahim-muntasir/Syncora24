import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { Mutex } from "async-mutex";
import { UserType } from "../../../types/auth";
import { userLoggedOut, userLoggedIn } from "../auth/authSlice";

const mutex = new Mutex();

// const getApiBase = () => {
//   if (process.env.NODE_ENV === "development") {
//     return `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;
//   }

//   return `/api/v1`;
// };

const getApiBase = () => {
  return (
    (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001") +
    "/api/v1"
  );
};

const baseQuery = fetchBaseQuery({
  baseUrl: getApiBase(),
  credentials: "include",

  prepareHeaders: (headers, { getState }) => {
    headers.set("ngrok-skip-browser-warning", "true");

    const state = getState() as {
      auth: {
        token: string | null;
      };
    };

    const token = state.auth.token;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Wait if another request is already refreshing
  await mutex.waitForUnlock();

  let result = await baseQuery(
    args,
    api,
    extraOptions
  );

  const isRefreshRequest =
  typeof args === "object" &&
  args.url === "/auth/refresh";

  if (result.error?.status === 401 && !isRefreshRequest) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();

      try {
        const refreshResult = await baseQuery(
          {
            url: "/auth/refresh",
            method: "POST",
          },
          api,
          extraOptions
        );

        if (
          refreshResult.data &&
          !refreshResult.error
        ) {
          const data = refreshResult.data as {
            data: {
              token: string;
              user: UserType;
            };
          };

          const newToken = data.data.token;
          const newUser = data.data.user;

          // Keep localStorage for now
          localStorage.setItem(
            "auth",
            JSON.stringify({
              token: newToken,
              user: newUser,
            })
          );

          // Update Redux
          api.dispatch(
            userLoggedIn({
              token: newToken,
              user: newUser,
            })
          );

          // Retry original request
          result = await baseQuery(
            args,
            api,
            extraOptions
          );
        } else {
          // Refresh failed
          localStorage.removeItem("auth");

          api.dispatch(userLoggedOut());

          if (typeof window !== "undefined") {
            window.location.href =
              "/auth/signin";
          }
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();

      result = await baseQuery(
        args,
        api,
        extraOptions
      );
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",

  baseQuery: baseQueryWithReauth,

  tagTypes: [
    "Quizzes",
    "CheckParticipants",
    "UserParticipantsQuzzes",
    "UserQuizzes",
    "TopParticipants",
  ],

  endpoints: () => ({}),

  keepUnusedDataFor: 300,
});