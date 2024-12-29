import { createSlice } from "@reduxjs/toolkit";

type isPhDragging = {
  isPhDragging: boolean;
};

const initialState: isPhDragging = {
  isPhDragging: false,
};

const isPhDraggingSlice = createSlice({
  name: "isPhDragging",
  initialState,
  reducers: {
    setIsPhDragging: (state, action) => {
      state.isPhDragging = action.payload;
    },
  },
});

export const { setIsPhDragging } = isPhDraggingSlice.actions;
export default isPhDraggingSlice.reducer;
