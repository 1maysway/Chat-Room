import React, { useEffect, useState } from "react";
import { closeNotification } from "./notificationSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Alert, Box } from "@mui/material";

function Notification() {
  const message = useAppSelector((state) => state.notification.value.message);
  const type = useAppSelector((state) => state.notification.value.type);
  const dispatch = useAppDispatch();

  const [tmtClearId,setTmtClearId] = useState<NodeJS.Timeout|null>(null);

  useEffect(() => {
    if (message) {
      tmtClearId && clearTimeout(tmtClearId);
      // Показать уведомление на определенное время, например, 5 секунд
      setTmtClearId(setTimeout(() => {
        dispatch(closeNotification());
      }, 5000));

      // Очистить таймер при размонтировании компонента
      return () => clearTimeout(tmtClearId||undefined);
    }
  }, [message, dispatch]);

  if (!message) {
    return null;
  }

  return (
    <Box sx={{position:'relative',width:"100vw",top:'0px',left:'0px',display:"flex",justifyContent:"center"}}>
      <Alert variant="filled" severity={type} sx={{width:"50vw",position:"fixed",top:"10vh",zIndex:'1000'}}>
        {message}
      </Alert>
    </Box>
  );
}

export default Notification;
