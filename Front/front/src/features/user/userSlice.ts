import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchUserInitialData } from "./userAPI";
import { RootState } from "../../app/store";

export type User = {
  loggedIn: boolean;
  info: {
    id: number;
    username: string;
    avatarUrl: string | null;
  } | null;
};

export interface UserState {
  value: User;
  status: "idle" | "loading" | "failed";
}

const initialState: UserState = {
  value: {
    loggedIn: false,
    info: null,
  },
  status: "loading",
};

export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async () => {
    const response:User = (await fetchUserInitialData());
    console.log(response);
    
    return response;
  }
);

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "idle";
        state.value = action.payload;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export const selectUser = (state: RootState) => state.user.value;
export const selectUserStatus = (state: RootState) => state.user.status;

export default userSlice.reducer;