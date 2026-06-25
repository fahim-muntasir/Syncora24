import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserType } from "@/types/auth";

type initialStateType = {
  user: UserType | null;
};

export const initialState: initialStateType  = {
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userLoggedIn: (state, action: PayloadAction<UserType | null>) => {
      state.user = action.payload;
    },
    userLoggedOut: (state) => {
      state.user = null;
    },
  },
});

export default authSlice.reducer;
export const { userLoggedIn, userLoggedOut } = authSlice.actions;