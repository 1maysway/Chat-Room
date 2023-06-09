import { createSlice } from "@reduxjs/toolkit";
import { AlertColor } from "@mui/material/Alert";

type Notification = {
  message: string | null;
  type: AlertColor;
};

export interface NotificationState {
  value: Notification;
}

const initialState: NotificationState = {
  value: {
    message: null,
    type: "error",
  },
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    showNotification: (state, action) => {
      state.value = Object.assign(state.value,action.payload);
    },
    closeNotification: (state) => {
      state.value.message = null;
    },
  },
});

export const { showNotification, closeNotification } =
  notificationSlice.actions;

export default notificationSlice.reducer;
