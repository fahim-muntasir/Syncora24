import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedOut } from "../auth/authSlice";

const getApiBase = () => {
  if (process.env.NODE_ENV === "development") {
    return `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;
  }

  return `/api/v1`;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: async (args, api, extraOptions) => {
    const baseQuery = fetchBaseQuery({
      baseUrl: getApiBase(),
      prepareHeaders: (headers) => {
        
        headers.set("ngrok-skip-browser-warning", "true");

        try {
          const auth = JSON.parse(localStorage.getItem("auth") || "{}");
  
          if (auth?.token) {
            headers.set("Authorization", `Bearer ${auth.token}`);
          }
        } catch (error) {
          console.error("Failed to retrieve auth token:", error);
        }

        return headers;
      },
    });

    const result = await baseQuery(args, api, extraOptions);

    // Handle unauthorized responses
    if (result.error && result.error.status === 401) {
      
      localStorage.removeItem("auth");
      api.dispatch(userLoggedOut());
      
      window.location.href = "/auth/signin";
    }

    return result;
  },
  tagTypes: ["Quizzes", "CheckParticipants", "UserParticipantsQuzzes", "UserQuizzes", "TopParticipants"],
  endpoints: () => ({}),
  keepUnusedDataFor: 300,
});
