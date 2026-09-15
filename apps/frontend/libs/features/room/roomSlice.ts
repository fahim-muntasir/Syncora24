import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RoomState {
  isAudioEnabled: boolean;
  isMuted: boolean;
  speakingUsers: string[];
  unMutedUsers: string[];
  forceMutedUsers: string[];
  moderatorIds: string[];
  kickedMemberIds: string[];
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
  moderatorIds: [],
  kickedMemberIds: [],
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
    setModeratorIds: (state, action: PayloadAction<string[]>) => {
      state.moderatorIds = action.payload;
    },
    setKickedMemberIds: (state, action: PayloadAction<string[]>) => {
      state.kickedMemberIds = action.payload;
    },
    addKickedMemberId: (state, action: PayloadAction<string>) => {
      if (!state.kickedMemberIds.includes(action.payload)) state.kickedMemberIds.push(action.payload);
    },
    addModeratorId: (state, action: PayloadAction<string>) => {
      if (!state.moderatorIds.includes(action.payload)) state.moderatorIds.push(action.payload);
    },
    removeModeratorId: (state, action: PayloadAction<string>) => {
      state.moderatorIds = state.moderatorIds.filter((id) => id !== action.payload);
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
  setModeratorIds,
  setKickedMemberIds,
  addKickedMemberId,
  addModeratorId,
  removeModeratorId,
  setForceMutedUsers,
  setMuteAll,
  clearUnMutedUsersExcept,
  setMuteAllExcludedUsers,
  setVolumeLevel,
  removeVolumeLevel,
  clearVolumeLevels,
} = roomSlice.actions;

export default roomSlice.reducer;
