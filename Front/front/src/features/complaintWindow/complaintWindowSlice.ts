import { Action, createSlice } from "@reduxjs/toolkit";
import { Message } from "../../types/simplifiedDatabaseTypes";

export type MessageComplaint = {
  message: Message;
  avatar_url?: string;
  username?: string;
};

export type UserComplaint = {
  user_id: number;
};

export type Complaint = {
  target: MessageComplaint | UserComplaint | null;
  room_id:number|null;
};

export interface ComplaintWindowState {
  value: Complaint;
}

const initialState: ComplaintWindowState = {
  value: {
    target: null,
    room_id: null,
  },
};

const complaintWindowSlice = createSlice({
  name: "complaint",
  initialState,
  reducers: {
    setComplaintWindow: (state, action) => {
      state.value = Object.assign(state.value, action.payload);
    },
    closeComplaintWindow: (state) => {
      state.value.target = null;
    },
  },
});

export const { setComplaintWindow, closeComplaintWindow } =
  complaintWindowSlice.actions;

export default complaintWindowSlice.reducer;
