import { Box, Button, Container } from "@mui/material";
import { useLocation } from "react-router-dom";
import { axiosClient } from "../Utils";
import config from "../config.json";
import { useState } from "react";

const EmailConfirm = () => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const buttonHandler = async () => {
    try {
      const reqBody = {
        data: {
          token: new URL(window.location.href).searchParams.get("t"),
        },
      };
      const res = await axiosClient.post(
        config.SERVER_BASE_URL + "email-confirm",
        reqBody
      );
      setIsConfirmed(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container>
      <Box
        sx={{
          padding: "96px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {isConfirmed ? (
          <h1 style={{margin:0}}>Email Confirmed</h1>
        ) : (
          <Button onClick={buttonHandler} variant="contained">
            Confirm email
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default EmailConfirm;
