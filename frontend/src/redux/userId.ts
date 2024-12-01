import { createSlice } from "@reduxjs/toolkit";

type userId = {
  userId: string;
};

const initialState: userId = {
  userId: "",
};

const userIdSlice = createSlice({
  name: "userId",
  initialState,
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
  },
});

export const { setUserId } = userIdSlice.actions;
export default userIdSlice.reducer;
