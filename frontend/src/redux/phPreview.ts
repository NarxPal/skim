import { createSlice } from "@reduxjs/toolkit";

type phPreview = {
  phPreview: number | null;
};

const initialState: phPreview = {
  phPreview: null,
};

const phPreviewSlice = createSlice({
  name: "phPreview",
  initialState,
  reducers: {
    setPhPreview: (state, action) => {
      state.phPreview = action.payload;
    },
  },
});

export const { setPhPreview } = phPreviewSlice.actions;
export default phPreviewSlice.reducer;
