import { configureStore } from "@reduxjs/toolkit";
import modalReducer from "@/libs/features/modal/modalSlice";
import authSliceReducer from "@/libs/features/auth/authSlice";
import roomReducer from "@/libs/features/room/roomSlice";
import filterSliceReducer from "@/libs/features/filter/filterSlice";
import { apiSlice } from "./features/api/apiSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      modal: modalReducer,
      auth: authSliceReducer,
      filter: filterSliceReducer,
      room: roomReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(apiSlice.middleware);
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
