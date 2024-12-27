import { configureStore } from "@reduxjs/toolkit";
import userIdReducer from "./userId";
import phPositionReducer from "./phPosition";

export const store = configureStore({
  reducer: {
    userId: userIdReducer,
    phPosition: phPositionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
