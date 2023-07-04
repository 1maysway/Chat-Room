import { useEffect, useState } from "react";
import { axiosClient, validateEmail } from "../Utils";
import config from "../config.json";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { isMobile } from "react-device-detect";
import { useDebounce } from "../hooks";
import CheckIcon from "@mui/icons-material/Check";
import TextFieldWithCheck, {
  TextFieldWithCheckStatus,
} from "../components/TextFieldWithCheck";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { showNotification } from "../features/notification/notificationSlice";
import { selectUser, selectUserStatus } from "../features/user/userSlice";
import { green } from "@mui/material/colors";
import ErrorIcon from "@mui/icons-material/Error";
import DoneIcon from "@mui/icons-material/Done";

type ProfileProps = {};

type ChangeableData = {
  email: string;
  username: string;
  country: string | null;
  city: string | null;
  language: string | null;
  age: number | null;
  gender: number | null;
};

type CBDv_with_check = {
  error: boolean;
  value: string | number | null;
  loading: boolean;
};

type SubmitButtonStatus = "loading" | "success" | "error" | "default";

type SubmitButtonProps = {
  status: SubmitButtonStatus;
  children: React.ReactNode;
  disabled?: boolean;
};

enum SubmitButtonStatusColor {
  loading = "primary",
  success = "success",
  error = "error",
  default = "primary",
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  status,
  children,
  disabled = false,
}) => {
  return (
    <Box sx={{ position: "relative" }}>
      <Button
        type="submit"
        variant="contained"
        color={SubmitButtonStatusColor[status]}
        disabled={disabled || status === "loading"}
      >
        <Box sx={{ opacity: status === "default" ? 1 : 0 }}>{children}</Box>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            marginTop: "-12px",
            marginLeft: "-12px",
          }}
        >
          {status === "loading" && (
            <CircularProgress
              size={24}
              sx={{
                color: green[500],
              }}
            />
          )}
          {status === "error" && <ErrorIcon />}
          {status === "success" && <DoneIcon />}
        </Box>
      </Button>
    </Box>
  );
};

const Profile: React.FC<ProfileProps> = ({}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const userStatus = useAppSelector(selectUserStatus);

  const [changeableData, setChangeableData] = useState<ChangeableData | null>(
    null
  );

  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<number | null>(null);

  const [usernameStatus, setUsernameStatus] =
    useState<TextFieldWithCheckStatus>("default");
  const [emailStatus, setEmailStatus] =
    useState<TextFieldWithCheckStatus>("default");

  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const [credentialsFormStatus, setCredentialsFormStatus] =
    useState<SubmitButtonStatus>("default");
  const [personalInfoFormStatus, setPersonalInfoFormStatus] =
    useState<SubmitButtonStatus>("default");
  const [anchatIdFormStatus, setAnchatIdFormStatus] =
    useState<SubmitButtonStatus>("default");

  const fetchChangeableData = async () => {
    const res = await axiosClient.get(config.SERVER_BASE_URL + "getProfile");

    const cbd: ChangeableData = res.data.data.changeableData_public;

    setChangeableData(cbd);

    setEmail(cbd.email);
    setUsername(cbd.username);
    setCountry(cbd.country);
    setCity(cbd.city);
    setLanguage(cbd.language);
    setAge(cbd.age);
    setGender(cbd.gender);
  };

  useEffect(() => {
    if (user.loggedIn) {
      fetchChangeableData();
    } else if (userStatus !== "loading") {
      window.location.assign("/");
    }
  }, [userStatus]);

  useEffect(() => {
    setAnchatIdFormStatus("default");
  }, [username]);

  useEffect(() => {
    setPersonalInfoFormStatus("default");
  }, [email, country, city, language, age, gender]);

  useEffect(() => {
    setCredentialsFormStatus("default");
  }, [currentPassword, newPassword]);

  const credentialsChecker = async (data: Record<string, string>) => {
    try {
      const res = await axiosClient.post(
        config.SERVER_BASE_URL + "checkForSameCredentials",
        {
          data,
        }
      );

      return res.data.data.canChoose;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const changePasswordFormHandler = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setCredentialsFormStatus("loading");

    const formData = new FormData(event.currentTarget);
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");

    const reqBody = {
      data: {
        currentPassword,
        newPassword,
      },
    };

    event.currentTarget.reset();

    try {
      const res = await axiosClient.post(
        config.SERVER_BASE_URL + "changePassword",
        reqBody
      );
      setCredentialsFormStatus("success");
    } catch (error: any) {
      console.error(error);

      setCredentialsFormStatus("error");
    }
  };

  const changePersonalInfoHandler = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPersonalInfoFormStatus("loading");

    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string) || "",
      country = (formData.get("country") as string) || null,
      city = (formData.get("city") as string) || null,
      language = (formData.get("language") as string) || null,
      age = parseInt(formData.get("age") as string) || null,
      gender = parseInt(formData.get("gender") as string);

    const reqBody = {
      data: {
        email,
        country,
        city,
        language,
        age,
        gender: [0,1,2].includes(gender) ? gender : null
      },
    };
    
    try {
      const res = await axiosClient.post(
        config.SERVER_BASE_URL + "changePersonalInfo",
        reqBody
      );

      setChangeableData((prev) => (prev ? { ...prev, ...reqBody.data } : null));

      setPersonalInfoFormStatus("success");
    } catch (error: any) {
      console.error(error);

      setPersonalInfoFormStatus("error");
    }
  };

  const changeAnchatIdHandler = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setAnchatIdFormStatus("loading");

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username") as string;

    const reqBody = {
      data: {
        username,
      },
    };

    try {
      const res = await axiosClient.post(
        config.SERVER_BASE_URL + "changeAnchatId",
        reqBody
      );

      setChangeableData((prev) => (prev ? { ...prev, username } : null));

      setAnchatIdFormStatus("success");
    } catch (error: any) {
      console.error(error);

      setAnchatIdFormStatus("error");
    }
  };

  const getIsAnchatIdChanged = () => {
    return changeableData?.username !== username;
  };

  const getIsPersonalInfoChanged = () => {
    const values = {
      email,
      country,
      city,
      language,
      age,
      gender,
    };
    return Object.entries(values).some(([key, value]) =>
      changeableData
        ? changeableData[key as keyof typeof values] !== value
        : true
    );
  };

  // console.log(changeableData?.username,username, usernameStatus!=="default");

  return (
    <Container
      maxWidth="md"
      sx={{
        paddingTop: "24px",
      }}
    >
      {changeableData && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Grid container>
              <Grid item xs={12}>
                <h1>AnChat ID</h1>
              </Grid>
              <Grid item xs={12}>
                <Box component={"form"} onSubmit={changeAnchatIdHandler}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextFieldWithCheck
                              name="username"
                              checker={(username) =>
                                credentialsChecker({ username })
                              }
                              disabled={anchatIdFormStatus === "loading"}
                              status={usernameStatus}
                              onStatusChange={setUsernameStatus}
                              value={username}
                              onChange={setUsername}
                              currentValue={changeableData.username}
                              statusHelperTexts={[
                                {
                                  status:"error",
                                  helperText:"Пользователь с таким никнеймом уже существует"
                                },
                                {
                                  status:"success",
                                  helperText:"Никнейм свободен"
                                }
                              ]}
                            />
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <SubmitButton
                        status={anchatIdFormStatus}
                        disabled={
                          !getIsAnchatIdChanged() ||
                          (usernameStatus !== "default" && usernameStatus!=="success")
                        }
                      >
                        Save changes
                      </SubmitButton>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Grid container>
              <Grid item xs={12}>
                <h1>Personal Information</h1>
              </Grid>
              <Grid item xs={12}>
                <Box component={"form"} onSubmit={changePersonalInfoHandler}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextFieldWithCheck
                              initialValue={email}
                              name="email"
                              checker={(email) => credentialsChecker({ email })}
                              validate={validateEmail}
                              disabled={personalInfoFormStatus === "loading"}
                              status={emailStatus}
                              onStatusChange={setEmailStatus}
                              value={email}
                              onChange={setEmail}
                              currentValue={changeableData.email}
                              statusHelperTexts={[
                                {
                                  status:"error",
                                  helperText:"Пользователь с таким адресом уже существует, или он введен некорректно"
                                },
                                {
                                  status:"success",
                                  helperText:"Адрес свободен"
                                }
                              ]}
                            />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            type="text"
                            variant="outlined"
                            name="country"
                            value={country || ""}
                            onChange={(e) => setCountry(e.target.value || null)}
                            label="Country"
                            fullWidth
                            disabled={personalInfoFormStatus === "loading"}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            type="text"
                            variant="outlined"
                            name="city"
                            value={city || ""}
                            onChange={(e) => setCity(e.target.value || null)}
                            label="City"
                            fullWidth
                            disabled={personalInfoFormStatus === "loading"}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            type="text"
                            variant="outlined"
                            name="language"
                            value={language || ""}
                            onChange={(e) => setLanguage(e.target.value || null)}
                            label="Language"
                            fullWidth
                            disabled={personalInfoFormStatus === "loading"}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            type="number"
                            variant="outlined"
                            name="age"
                            value={age||""}
                            onChange={(e) =>
                              setAge(Math.max(Math.min(parseInt(e.target.value),100),0) || null)
                            }
                            label="age"
                            fullWidth
                            disabled={personalInfoFormStatus === "loading"}
                            InputProps={{ inputProps: { min: 0, max: 100 } }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          {/* <TextField
                            type="text"
                            variant="outlined"
                            name="gender"
                            value={gender}
                            onChange={(e) => setCountry(e.target.value)}
                            label="Gender"
                            fullWidth
                            disabled={personalInfoFormStatus === "loading"}
                          /> */}
                          <FormControl
                            sx={{
                              minWidth: 120,
                              boxSizing: "border-box",
                              width: "100%",
                            }}
                          >
                            <Select
                              value={gender !== null ? gender:-1}
                              onChange={(e) =>
                                setGender(() => {
                                  const val = parseInt(
                                    e.target.value?.toString() || "-1"
                                  );
                                  console.log(val === -1 ? null : val);
                                  
                                  return val === -1 ? null : val;
                                })
                              }
                              displayEmpty
                              inputProps={{ "aria-label": "Without label" }}
                              disabled={personalInfoFormStatus === "loading"}
                              name="gender"
                            >
                              <MenuItem value={-1}>
                                <em>Gender</em>
                              </MenuItem>
                              <MenuItem value={0}>Female</MenuItem>
                              <MenuItem value={1}>Male</MenuItem>
                              <MenuItem value={2}>Other</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <SubmitButton
                        status={personalInfoFormStatus}
                        disabled={!getIsPersonalInfoChanged()||(emailStatus !== "default" && emailStatus!=="success")}
                      >
                        Save and verify
                      </SubmitButton>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Grid container>
              <Grid item xs={12}>
                <h1>Credentials</h1>
              </Grid>
              <Grid item xs={12}>
                <Box component={"form"} onSubmit={changePasswordFormHandler}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <TextField
                                name="currentPassword"
                                label="Current password"
                                fullWidth
                                required
                                value={currentPassword}
                                onChange={(e) =>
                                  setCurrentPassword(e.target.value)
                                }
                                disabled={credentialsFormStatus === "loading"}
                                type="password"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                name="newPassword"
                                label="New password"
                                fullWidth
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={credentialsFormStatus === "loading"}
                                type="password"
                              />
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <SubmitButton status={credentialsFormStatus}>
                        Save changes
                      </SubmitButton>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Profile;
