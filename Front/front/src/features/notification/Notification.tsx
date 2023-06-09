import React, { useEffect } from "react";
import { closeNotification } from "./notificationSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Alert, Box } from "@mui/material";

function Notification() {
  const message = useAppSelector((state) => state.notification.value.message);
  const type = useAppSelector((state) => state.notification.value.type);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (message) {
      // Показать уведомление на определенное время, например, 5 секунд
      const timeout = setTimeout(() => {
        dispatch(closeNotification());
      }, 5000);

      // Очистить таймер при размонтировании компонента
      return () => clearTimeout(timeout);
    }
  }, [message, dispatch]);

  if (!message) {
    return null;
  }

  return (
    <Box sx={{position:'relative',width:"100vw",top:'0px',left:'0px',display:"flex",justifyContent:"center"}}>
      <Alert variant="filled" severity={type} sx={{width:"50vw",position:"absolute",top:"10vh",zIndex:'1000'}}>
        {message}
      </Alert>
    </Box>
  );
}

export default Notification;
