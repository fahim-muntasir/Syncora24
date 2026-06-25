import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type InitialState = {
  searchQuery: string;
  Category: string;
  Difficulty: string;
  Duration: string;
};

export const initialState: InitialState = {
  searchQuery: "",
  Category: "",
  Difficulty: "",
  Duration: "",
};

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    search: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    filterByCategory: (state, action: PayloadAction<string>) => {
      state.Category = action.payload;
    },
    filterByDifficulty: (state, action: PayloadAction<string>) => {
      state.Difficulty = action.payload;
    },
    filterByDuration: (state, action: PayloadAction<string>) => {
      state.Duration = action.payload;
    },
  },
});

export default filterSlice.reducer;
export const { search, filterByCategory, filterByDifficulty, filterByDuration } = filterSlice.actions;
