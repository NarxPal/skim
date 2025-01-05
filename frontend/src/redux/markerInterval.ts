import { createSlice } from "@reduxjs/toolkit";

type markerInterval = {
  markerInterval: number;
};

const initialState: markerInterval = {
  markerInterval: 0,
};

const markerIntervalSlice = createSlice({
  name: "markerInterval",
  initialState,
  reducers: {
    setMarkerInterval: (state, action) => {
      state.markerInterval = action.payload;
    },
  },
});

export const { setMarkerInterval } = markerIntervalSlice.actions;
export default markerIntervalSlice.reducer;
