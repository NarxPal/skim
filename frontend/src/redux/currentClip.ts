import { createSlice } from "@reduxjs/toolkit";
import { bar } from "@/interfaces/barsProp";

type currentClip = {
  currentClip: boolean;
};

const initialState: currentClip = {
  currentClip: false,
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
