import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserType } from "@/types/auth";

type initialStateType = {
  user: UserType | null;
  token: string | null;
};

export const initialState: initialStateType  = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userLoggedIn: (state, action: PayloadAction<{
      user: UserType;
      token: string;
    }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    userLoggedOut: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

export default authSlice.reducer;
export const { userLoggedIn, userLoggedOut } = authSlice.actions;