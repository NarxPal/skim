import { createSlice } from "@reduxjs/toolkit";

type Clip = {
  startTime: number;
  endTime: number;
  videoUrl: string;
};
type currentClip = {
  currentClip: Clip | null;
};

const initialState: currentClip = {
  currentClip: null,
};

const currentClipSlice = createSlice({
  name: "currentClip",
  initialState,
  reducers: {
    setCurrentClip: (state, action) => {
      state.currentClip = action.payload;
    },
  },
});

export const { setCurrentClip } = currentClipSlice.actions;
export default currentClipSlice.reducer;
