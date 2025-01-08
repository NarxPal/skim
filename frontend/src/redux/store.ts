import { configureStore } from "@reduxjs/toolkit";
import userIdReducer from "./userId";
import phPositionReducer from "./phPosition";
import phPreviewReducer from "./phPreview";
import isPhDraggingReducer from "./isPhDragging";
import markerIntervalReducer from "./markerInterval";
import currentClipReducer from "./currentClip";

export const store = configureStore({
  reducer: {
    userId: userIdReducer,
    phPosition: phPositionReducer,
    phPreview: phPreviewReducer,
    isPhDragging: isPhDraggingReducer,
    markerInterval: markerIntervalReducer,
    currentClip: currentClipReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
