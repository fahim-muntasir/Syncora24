import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const initialState = {
  createRoomModal: { isOpen: false },
  authModal: {
    isOpen: false,
    mode: "choice" as "choice" | "signin" | "signup",
  },
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    openCreateRoomModal: (state) => {
      state.createRoomModal.isOpen = true;
    },
    closeCreateRoomModal: (state) => {
      state.createRoomModal.isOpen = false;
    },
    openAuthenticationModal: (
      state,
      action: PayloadAction<"choice" | "signin" | "signup" | undefined>,
    ) => {
      state.authModal.isOpen = true;
      state.authModal.mode = action.payload ?? "choice";
    },
    closeAuthenticationModal: (state) => {
      state.authModal.isOpen = false;
    },
    setAuthenticationModalMode: (
      state,
      action: PayloadAction<"choice" | "signin" | "signup">,
    ) => {
      state.authModal.mode = action.payload;
    },
  },
});

export default modalSlice.reducer;
export const {
  openCreateRoomModal,
  closeCreateRoomModal,
  openAuthenticationModal,
  closeAuthenticationModal,
  setAuthenticationModalMode,
} = modalSlice.actions;
