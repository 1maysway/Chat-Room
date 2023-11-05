import { Box, Container } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectUser } from "../features/user/userSlice";

const Main: React.FC = () => {
  return (
    <Container sx={{ height: "100%", flexGrow: 1, display: "flex" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
          padding:"96px"
        }}
      >
        <h1 style={{fontSize:"96px"}}>ANCHAT</h1>
      </Box>
    </Container>
  );
};

export default Main;
