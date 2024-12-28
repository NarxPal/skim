import { configureStore } from "@reduxjs/toolkit";
import userIdReducer from "./userId";
import phPositionReducer from "./phPosition";
import phPreviewReducer from "./phPreview";

export const store = configureStore({
  reducer: {
    userId: userIdReducer,
    phPosition: phPositionReducer,
    phPreview: phPreviewReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
