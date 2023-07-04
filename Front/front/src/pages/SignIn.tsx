import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  CssBaseline,
  FormControlLabel,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Link } from "react-router-dom";
import {
  logIn,
  register,
  twoStep as twoStepAuth,
} from "../features/user/userAPI";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { showNotification } from "../features/notification/notificationSlice";
import { AxiosError } from "axios";
import { selectUser } from "../features/user/userSlice";
import { useVisibilityChange, useWindowFocus } from "../hooks";
import { axiosClient, millisecondsToTimeStrings } from "../Utils";
import { isMobile } from "react-device-detect";
import config from "../config.json";

type FormProps = {
  handleSubmit: (
    event: FormEvent<HTMLFormElement>,
    isLoggingIn: boolean
  ) => any;
  isLoading?: boolean;
};

type TwoStepFormProps = {
  handleSubmit: (event: FormEvent<HTMLFormElement>) => any;
  isLoading?: boolean;
  charsNumber?: number;
  handleResendConfirmCode: () => any;
  emailConfirmCodeExpires: number;
  canSendNewCodeIn: number;
};

const Form: React.FC<FormProps> = ({ handleSubmit, isLoading = false }) => {
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(true);
  const [remember,setRemember] = useState(axiosClient.defaults.headers["remember-browser"] === "true"
  ? true
  : false);

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        handleSubmit(e, isLoggingIn);
      }}
      sx={{ mt: 1 }}
    >
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
          disabled={isLoading}
        />
        {!isLoggingIn && (
          <TextField
            margin="normal"
            required
            fullWidth
            name="username"
            label="Username"
            type="text"
            id="username"
            autoComplete="username"
            disabled={isLoading}
          />
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          disabled={isLoading}
        />
        <FormControlLabel
          control={
            <Checkbox
              value="remember"
              color="primary"
              onChange={(e) =>{
                (axiosClient.defaults.headers["remember-browser"] =
                  e.target.checked + "");
                  setRemember(e.target.checked);
              }}
              checked={remember}
            />
          }
          label="Remember me"
          disabled={isLoading}
        />
      </Box>
      <Box
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        sx={{ mt: 3, mb: 2 }}
      >
        {isLoading ? (
          <CircularProgress color="inherit" sx={{ height: "100%" }} />
        ) : (
          <Button
            type="submit"
            fullWidth
            variant="contained"
            // sx={{ mt: 3, mb: 2 }}
          >
            {isLoggingIn ? "Sign In" : "Register"}
          </Button>
        )}
      </Box>
      <Grid container>
        {isLoggingIn && (
          <Grid item xs>
            <Button variant="text" disableRipple={true} disabled={isLoading}>
              Forgot password?
            </Button>
          </Grid>
        )}
        <Grid item>
          <Button
            onClick={() => {
              setIsLoggingIn((pv) => !pv);
            }}
            variant="text"
            disableRipple={true}
            disabled={isLoading}
          >
            {isLoggingIn
              ? "Don't have an account? Sign Up"
              : "Already have an account? Sign In"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const TwoStepForm: React.FC<TwoStepFormProps> = ({
  charsNumber = 6,
  handleSubmit,
  isLoading,
  canSendNewCodeIn,
  emailConfirmCodeExpires,
  handleResendConfirmCode,
}) => {
  const [codes, setCodes] = useState(Array(charsNumber).fill(""));
  const codeInputs = useRef<(HTMLInputElement | null)[]>([]);
  const isPageVisible = useVisibilityChange();
  const isPageFocused = useWindowFocus();
  const [sendNewCodeTimer, setSendNewCodeTimer] = useState(0);

  const handleCodeChange = (
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    console.log(event);

    const { value } = event.target;

    const newChar = value.replace(/\D/g, "") || null;

    if (newChar) {
      const newCodes = [...codes];
      newCodes[index] = newChar;
      setCodes(newCodes);

      if (value.length === 1 && index < 5 && codeInputs.current[index + 1]) {
        codeInputs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    index: number
  ) => {
    switch (event.key) {
      case "Backspace": {
        event.preventDefault();
        const newCodes = [...codes];

        if (index > 0 && !newCodes[index] && codeInputs.current[index - 1]) {
          newCodes[index - 1] = "";
          codeInputs.current[index - 1]?.focus();
        }

        newCodes[index] = "";

        setCodes(newCodes);
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        if (index > 0 && codeInputs.current[index - 1]) {
          codeInputs.current[index - 1]?.focus();
        }
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        if (index < codes.length - 1 && codeInputs.current[index + 1]) {
          codeInputs.current[index + 1]?.focus();
        }
        break;
      }
    }
  };

  const handleCodePaste = (
    event: React.ClipboardEvent<HTMLInputElement>,
    index: number
  ) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text");
    const sanitizedData = pastedData.replace(/\D/g, ""); // Удаление всех символов, кроме цифр

    let newCodes = sanitizedData.slice(0, charsNumber).split("");
    console.log(newCodes);

    newCodes = [
      ...codes.slice(0, index),
      ...newCodes.slice(0, charsNumber - index),
      ...(newCodes.length > charsNumber ? [] : codes.slice(charsNumber)),
    ];
    console.log(newCodes);

    setCodes(newCodes);

    (
      codeInputs.current[sanitizedData.length - 1] ||
      codeInputs.current[codeInputs.current.length - 1]
    )?.focus();
  };

  const pasteFromClipboard = async () => {
    console.log(isPageVisible, document.hasFocus());

    if (isPageVisible && document.hasFocus()) {
      try {
        const text = await navigator.clipboard.readText().catch((e) => {
          console.error(e);
          return "";
        });
  
        const sanitizedData = text.replace(/[^0-9]/g, "");
  
        if (
          sanitizedData.length === codes.length &&
          sanitizedData !== codes.join("")
        ) {
          const splitted = sanitizedData.split("");
  
          codeInputs.current.forEach((ci) => ci?.blur());
  
          const fillCodes = async (arr: string[], gap: number = 50) => {
            for (let i = 0; i < arr.length; i++) {
              setCodes((prev) => [
                ...arr.slice(0, i + 1),
                ...prev.slice(i + 1, prev.length),
              ]);
              await new Promise((r) => {
                setTimeout(r, gap);
              });
            }
          };
          codes.every((c) => c !== "") &&
            (await fillCodes(Array(codes.length).fill("")));
          await fillCodes(splitted);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    window.focus();
    setTimeout(() => {
      pasteFromClipboard();
    }, 100);
  }, [isPageVisible]);

  useEffect(() => {
    const tmid =
      sendNewCodeTimer < canSendNewCodeIn &&
      setTimeout(() => {
        setSendNewCodeTimer((prev) => prev + 1000);
      }, 1000);

    if (tmid)
      return () => {
        clearTimeout(tmid);
      };
  }, [sendNewCodeTimer]);

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "12px" }}>
      <Box>
        <Grid container flexDirection={"column"} rowSpacing={3}>
          <Grid item>
            <Grid container spacing={1}>
              {codes.map((code, index) => (
                <Grid
                  item
                  xs={isMobile ? 12 / codes.length : "auto"}
                  key={index}
                >
                  <TextField
                    key={index}
                    value={code}
                    onPaste={(event: React.ClipboardEvent<HTMLInputElement>) =>
                      handleCodePaste(event, index)
                    }
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    inputRef={(input) => {
                      codeInputs.current[index] = input;
                    }}
                    onInput={(event: ChangeEvent<HTMLInputElement>) =>
                      handleCodeChange(event, index)
                    }
                    onFocus={(event) => {
                      event.currentTarget.select();
                    }}
                    inputProps={{
                      maxLength: 1,
                      pattern: "[0-9]",
                      style: {
                        height: isMobile ? "auto" : "60px",
                        padding: "0px",
                        textAlign: "center",
                        fontSize: "48px",
                        fontWeight: "700",
                      },
                    }}
                    type="text"
                    variant="outlined"
                    required
                    sx={{
                      width: isMobile ? "auto" : "60px",
                    }}
                    name="codeCell"
                    disabled={isLoading}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid item>
            <Grid
              container
              rowSpacing={3}
              display={"flex"}
              justifyContent={"center"}
              flexDirection={"column"}
            >
              <Grid
                item
                sx={{ width: "100%" }}
                display={"flex"}
                justifyContent={"center"}
              >
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={codes.some((c) => !c) || isLoading}
                >
                  Confirm email
                </Button>
              </Grid>
              <Grid
                item
                sx={{ width: "100%" }}
                display={"flex"}
                justifyContent={"center"}
              >
                <Button
                  variant="text"
                  color="info"
                  disabled={sendNewCodeTimer < canSendNewCodeIn || isLoading}
                  size="small"
                  onClick={() => {
                    handleResendConfirmCode();
                    setSendNewCodeTimer(0);
                  }}
                >
                  Resend code{" "}
                  {sendNewCodeTimer < canSendNewCodeIn &&
                    `in ${(() => {
                      const time = millisecondsToTimeStrings(
                        canSendNewCodeIn - sendNewCodeTimer
                      );
                      return time.minutes + ":" + time.seconds;
                    })()}`}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </form>
  );
};

const SignIn = () => {
  const user = useAppSelector(selectUser);
  const [twoStep, setTwoStep] = useState<{
    user_id: number;
    emailConfirmCodeExpires: number;
    canSendNewCodeIn: number;
  } | null>(null);
  const [isFormLoading, setIsFormLoading] = useState<boolean>(false);
  const [isTwoStepFormLoading, setIsTwoStepFormLoading] =
    useState<boolean>(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  if (user.loggedIn) {
    window.location.assign("/");
  }

  const dispatch = useAppDispatch();

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    isLoggingIn: boolean
  ) => {
    event.preventDefault();

    setIsFormLoading(true);

    console.log(event);

    const data = new FormData(event.currentTarget);
    const email = (data.get("email") as string) || "";
    const password = (data.get("password") as string) || "";
    const username = (data.get("username") as string) || "";

    setCredentials({ email, password });

    const signin = isLoggingIn
      ? await logIn(email, password)
      : ((await register(email, password, username)) as any);
    console.log(signin);

    if (signin && signin.status === 200) {
      setTwoStep(signin.data.data);
    } else if (signin) {
      console.log(signin);

      // const message =
      //   signin instanceof AxiosError
      //     ? signin.response?.data.message
      //     : signin?.data?.data?.message || "ERROR";

      // dispatch(showNotification({ message, type: "error" }));
    }
    setIsFormLoading(false);
  };

  const handleTwoStepSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setIsTwoStepFormLoading(true);

    const data = new FormData(event.currentTarget);

    const confirmCode = data.getAll("codeCell").join("") as string;

    console.log(confirmCode);

    if (twoStep) {
      const res = (await twoStepAuth(twoStep?.user_id, confirmCode)) as any;

      if (res && res.status === 200) {
        window.location.assign("/");
      } else if (res) {
        console.log(res);

        setIsTwoStepFormLoading(false);

        // const message =
        //   res instanceof AxiosError
        //     ? res.response?.data.message
        //     : res?.data?.data?.message || "ERROR";

        // dispatch(showNotification({ message, type: "error" }));
      }
    }
  };

  const handleResendConfirmCode = async () => {
    if (credentials) {
      try {
        const login = (await logIn(
          credentials.email,
          credentials.password
        )) as any;

        if (login && login.status === 200) {
          setTwoStep(login.data.data);
        }

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    }
  };

  return (
    <Container component="main" maxWidth={twoStep ? "xl" : "xs"}>
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
        {twoStep ? (
          <TwoStepForm
            handleSubmit={handleTwoStepSubmit}
            isLoading={isTwoStepFormLoading}
            handleResendConfirmCode={handleResendConfirmCode}
            {...twoStep}
          />
        ) : (
          <Form handleSubmit={handleSubmit} isLoading={isFormLoading} />
        )}
      </Box>
    </Container>
  );
};

export default SignIn;
