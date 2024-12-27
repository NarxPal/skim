import { createSlice } from "@reduxjs/toolkit";

type phPosition = {
  phPosition: number;
};

const initialState: phPosition = {
  phPosition: 0,
};

const phPositionSlice = createSlice({
  name: "phPosition",
  initialState,
  reducers: {
    setPhPosition: (state, action) => {
      state.phPosition += action.payload;
    },
  },
});

export const { setPhPosition } = phPositionSlice.actions;
export default phPositionSlice.reducer;
