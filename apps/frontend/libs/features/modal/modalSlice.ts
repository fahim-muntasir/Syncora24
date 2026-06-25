import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  createRoomModal: { isOpen: false },
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
  },
});

export default modalSlice.reducer;
export const {
  openCreateRoomModal,
  closeCreateRoomModal,
} = modalSlice.actions;
