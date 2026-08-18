import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RoomState {
  isAudioEnabled: boolean;
  isMuted: boolean;
  speakingUsers: string[];
  unMutedUsers: string[];
  forceMutedUsers: string[];
  muteAll: boolean;
  muteAllExcludedUsers: string[];
  volumeLevels: Record<string, number>;
}

const initialState: RoomState = {
  isAudioEnabled: false,
  isMuted: false,
  speakingUsers: [],
  unMutedUsers: [],
  forceMutedUsers: [],
  muteAll: false,
  muteAllExcludedUsers: [],
  volumeLevels: {},
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
      state.speakingUsers = state.speakingUsers.filter(
        (id) => id !== action.payload,
      );
    },
    setUnMutedUser: (state, action: PayloadAction<string>) => {
      state.unMutedUsers = [...state.unMutedUsers, action.payload];
    },
    removeUnMutedUser: (state, action: PayloadAction<string>) => {
      state.unMutedUsers = state.unMutedUsers.filter(
        (id) => id !== action.payload,
      );
    },
    clearSpeakingUsers: (state) => {
      state.speakingUsers = [];
    },
    clearUnMutedUsers: (state) => {
      state.unMutedUsers = [];
    },
    clearUnMutedUsersExcept: (state, action: PayloadAction<string[]>) => {
      const excludedUsers = action.payload;

      state.unMutedUsers = state.unMutedUsers.filter((userId) =>
        excludedUsers.includes(userId),
      );
    },
    setForceMutedUser: (state, action: PayloadAction<string>) => {
      if (!state.forceMutedUsers.includes(action.payload)) {
        state.forceMutedUsers.push(action.payload);
      }
    },
    setForceMutedUsers: (state, action: PayloadAction<string[]>) => {
      state.forceMutedUsers = action.payload;
    },
    removeForceMutedUser: (state, action: PayloadAction<string>) => {
      state.forceMutedUsers = state.forceMutedUsers.filter(
        (id) => id !== action.payload,
      );
    },
    clearForceMutedUsers: (state) => {
      state.forceMutedUsers = [];
    },
    setMuteAll: (state, action: PayloadAction<boolean>) => {
      state.muteAll = action.payload;
    },
    setMuteAllExcludedUsers: (state, action: PayloadAction<string[]>) => {
      state.muteAllExcludedUsers = action.payload;
    },
    setVolumeLevel: (
      state,
      action: PayloadAction<{
        userId: string;
        volume: number;
      }>,
    ) => {
      state.volumeLevels[action.payload.userId] = action.payload.volume;
    },

    removeVolumeLevel: (state, action: PayloadAction<string>) => {
      delete state.volumeLevels[action.payload];
    },

    clearVolumeLevels: (state) => {
      state.volumeLevels = {};
    },
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
  setForceMutedUser,
  removeForceMutedUser,
  clearForceMutedUsers,
  setForceMutedUsers,
  setMuteAll,
  clearUnMutedUsersExcept,
  setMuteAllExcludedUsers,
  setVolumeLevel,
  removeVolumeLevel,
  clearVolumeLevels,
} = roomSlice.actions;

export default roomSlice.reducer;
