import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Container,
  CssBaseline,
  FormControlLabel,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Link } from "react-router-dom";
import { logIn, register } from "../features/user/userAPI";
import { FormEvent, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { showNotification } from "../features/notification/notificationSlice";
import { AxiosError } from "axios";
import { selectUser } from "../features/user/userSlice";

type FormProps = {
  handleSubmit: (
    event: FormEvent<HTMLFormElement>,
    isLoggingIn: boolean
  ) => any;
};

const Form: React.FC<FormProps> = ({ handleSubmit }) => {
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(true);

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        handleSubmit(e, isLoggingIn);
      }}
      sx={{ mt: 1 }}
    >
      {isLoggingIn ? (
        <Box>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            type="email"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <FormControlLabel
            control={<Checkbox value="remember" color="primary" />}
            label="Remember me"
          />
        </Box>
      ) : (
        <Box>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            type="email"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="username"
            label="Username"
            type="text"
            id="username"
            autoComplete="username"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
          />
        </Box>
      )}
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        {isLoggingIn ? "Sign In" : "Register"}
      </Button>
      <Grid container>
        {isLoggingIn && (
          <Grid item xs>
            <Link to="#">Forgot password?</Link>
          </Grid>
        )}
        <Grid item>
          <Link
            to="#"
            onClick={() => {
              setIsLoggingIn((pv) => !pv);
            }}
          >
            {isLoggingIn
              ? "Don't have an account? Sign Up"
              : "Already have an account? Sign In"}
          </Link>
        </Grid>
      </Grid>
    </Box>
  );
};

const SignIn = () => {
  const user = useAppSelector(selectUser);

  if (user.loggedIn) {
    window.location.assign("/");
  }

  const dispatch = useAppDispatch();

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    isLoggingIn: boolean
  ) => {
    event.preventDefault();
    console.log(event);

    const data = new FormData(event.currentTarget);
    const email = (data.get("email") as string) || "";
    const password = (data.get("password") as string) || "";
    const username = (data.get("username") as string) || "";

    const signin = isLoggingIn
      ? await logIn(email, password)
      : ((await register(email, password, username)) as any);
    console.log(signin);

    if (signin && signin.status === 200) {
      window.location.assign("/");
    } else if (signin) {
      console.log(signin);

      const message =
        signin instanceof AxiosError
          ? signin.response?.data.message
          : signin?.data?.data?.message || "ERROR";

      dispatch(showNotification({ message }));
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Form handleSubmit={handleSubmit} />
      </Box>
    </Container>
  );
};

export default SignIn;
