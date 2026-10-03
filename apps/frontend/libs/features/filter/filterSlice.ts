import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type InitialState = {
  searchKeywords: string[];
};

export const initialState: InitialState = {
  searchKeywords: [],
};

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    addSearchKeyword: (state, action: PayloadAction<string>) => {
      const keyword = action.payload.trim();

      if (
        keyword &&
        !state.searchKeywords.some(
          (existingKeyword) =>
            existingKeyword.toLowerCase() === keyword.toLowerCase(),
        )
      ) {
        state.searchKeywords.push(keyword);
      }
    },
    removeSearchKeyword: (state, action: PayloadAction<string>) => {
      state.searchKeywords = state.searchKeywords.filter(
        (keyword) =>
          keyword.toLowerCase() !== action.payload.toLowerCase(),
      );
    },
    clearSearchKeywords: (state) => {
      state.searchKeywords = [];
    }
  },
});

export default filterSlice.reducer;
export const {
  addSearchKeyword,
  removeSearchKeyword,
  clearSearchKeywords,
} = filterSlice.actions;
