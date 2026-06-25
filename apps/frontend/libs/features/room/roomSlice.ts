import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RoomState {
  isAudioEnabled: boolean;
  isMuted: boolean;
  speakingUsers: string[];
  unMutedUsers: string[];
}

const initialState: RoomState = {
  isAudioEnabled: false,
  isMuted: false,
  speakingUsers: [],
  unMutedUsers: [],
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setAudioEnabled: (state, action: PayloadAction<boolean>) => {
      state.isAudioEnabled = action.payload;
    },
    setMuted: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;
    },
    setSpeakingUser: (state, action: PayloadAction<string>) => {
      state.speakingUsers = [...state.speakingUsers, action.payload];
    },
    removeSpeakingUser: (state, action: PayloadAction<string>) => {
      state.speakingUsers = state.speakingUsers.filter((id) => id !== action.payload);
    },
    setUnMutedUser: (state, action: PayloadAction<string>) => {
      state.unMutedUsers = [...state.unMutedUsers, action.payload];
    },
    removeUnMutedUser: (state, action: PayloadAction<string>) => {
      state.unMutedUsers = state.unMutedUsers.filter((id) => id !== action.payload);
    },
    clearSpeakingUsers: (state) => {
      state.speakingUsers = [];
    },
    clearUnMutedUsers: (state) => {
      state.unMutedUsers = [];
    }
  },
});

export const {
  setAudioEnabled,
  setMuted,
  setSpeakingUser,
  removeSpeakingUser,
  clearSpeakingUsers,
  setUnMutedUser,
  removeUnMutedUser,
  clearUnMutedUsers,
} = roomSlice.actions;

export default roomSlice.reducer;
