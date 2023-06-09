import {
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useEffect, useRef, useState } from "react";
import config from "../config.json";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectUser, selectUserStatus } from "../features/user/userSlice";
import { showNotification } from "../features/notification/notificationSlice";
import Cookies from "universal-cookie";
import { convertDateTime, padZeroes } from "../Utils";
import Linkify from "react-linkify";
import { setComplaintWindow } from "../features/complaintWindow/complaintWindowSlice";
import FlagIcon from "@mui/icons-material/Flag";
import ".././style/pages/chat.css";
import { Message } from "../types/simplifiedDatabase";

//////////////////////////////

type FindRoomFormSubmitData = {
  country: string | null;
  city: string | null;
  language: string | null;
  age_from: number | null;
  age_to: number | null;
  gender: number | null;
};

type FindRoomFormProps = {
  handleSubmit: (data: FindRoomFormSubmitData) => any;
};

const FindRoomForm: React.FC<FindRoomFormProps> = ({ handleSubmit }) => {
  const [country, setCountry] = useState<string | undefined>(undefined);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [ageFrom, setAgeFrom] = useState<number | undefined>(undefined);
  const [ageTo, setAgeTo] = useState<number | undefined>(undefined);
  const [gender, setGender] = useState<number | undefined>(undefined);

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit({
          country: country || null,
          city: city || null,
          language: language || null,
          age_from: ageFrom || null,
          age_to: ageTo || null,
          gender: gender || null,
        });
      }}
      sx={{ mt: 1 }}
    >
      <Box>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <TextField
              margin="normal"
              fullWidth
              id="country"
              label="Country"
              name="country"
              type="text"
              onChange={(e) => {
                setCountry(e.currentTarget.value);
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              margin="normal"
              fullWidth
              id="city"
              label="City"
              name="city"
              type="text"
              onChange={(e) => {
                setCity(e.currentTarget.value);
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              margin="normal"
              fullWidth
              id="language"
              label="Language"
              name="language"
              type="text"
              onChange={(e) => {
                setLanguage(e.currentTarget.value);
              }}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              margin="normal"
              fullWidth
              id="age_from"
              label="Age from"
              name="age_from"
              type="number"
              onChange={(e) => {
                setAgeFrom(parseInt(e.currentTarget.value));
              }}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              margin="normal"
              fullWidth
              id="age_to"
              label="Age to"
              name="age_to"
              type="number"
              onChange={(e) => {
                setAgeTo(parseInt(e.currentTarget.value));
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl>
              <FormLabel id="gender-form">Gender</FormLabel>
              <RadioGroup
                aria-labelledby="gender-form"
                name="gender-radio-buttons-group"
                onChange={(e) => {
                  setGender(parseInt(e.currentTarget.value));
                }}
              >
                <FormControlLabel
                  value="0"
                  control={<Radio />}
                  label="Female"
                />
                <FormControlLabel value="1" control={<Radio />} label="Male" />
                <FormControlLabel value="2" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        Find
      </Button>
    </Box>
  );
};

const message_type_index_to_type = ["text", "info"];

type ChatComponentProps = {
  messages: Message[];
  roomUsers: RoomUser[];
  handleSubmit: (event: FormEvent<HTMLFormElement>) => any;
  roomClosed: boolean;
  handleFindNewRoom: () => any;
  handleComplaint?:(target_id:number,message_id?:string)=>any
};

type RoomUser = {
  id: number;
  username: string;
  avatar_url: string | null;
};

export type MessageTextProps = {
  text: string;
  username?: string;
  avatar_url?: string;
  time?: string;
  isFirst?: boolean;
  handleComplaint?: () => any;
  blockMargin?: boolean;
  urls?: boolean;
};

export const MessageText: React.FC<MessageTextProps> = ({
  text,
  username,
  avatar_url,
  time,
  isFirst = true,
  handleComplaint,
  blockMargin = true,
  urls = true,
}) => {
  return (
    <Box
      sx={{
        width: "100%",
        ...(blockMargin && {
          marginBlock: "6px",
          marginTop: isFirst ? "12px" : "6px",
        }),
      }}
      className="message"
    >
      <Grid container sx={{ height: "100%" }} columnSpacing={2}>
        <Grid item xs={2} sm={1.5} display={"flex"} justifyContent={"center"}>
          {isFirst && (
            <Avatar src={avatar_url}>{username && username[0]}</Avatar>
          )}
        </Grid>
        <Grid
          item
          xs={9}
          sm={9.5}
          display={"flex"}
          alignItems={"start"}
          justifyContent={"end"}
          flexDirection={"column"}
        >
          {isFirst && (
            <Box flexGrow={1}>
              <Grid container spacing={2}>
                {username && (
                  <Grid item color={"rgb(25, 118, 210)"}>
                    {username}
                  </Grid>
                )}
                {time && (
                  <Grid item color={"gray"}>
                    {time}
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
          <Box
            sx={{
              minHeight: "18px",
              verticalAlign: "bottom",
              whiteSpace: "pre-line",
              wordBreak: "break-all",
            }}
          >
            {urls ? (
              <Linkify
                componentDecorator={(href, text, key) => (
                  <a href={href} key={key} target="_blank" rel="noreferrer">
                    {text}
                  </a>
                )}
              >
                {text}
              </Linkify>
            ) : (
              text
            )}
          </Box>
        </Grid>
        <Grid
          item
          xs={1}
          sx={{ display: "flex", justifyContent: "end", alignItems: "start" }}
        >
          {handleComplaint && (
            <IconButton
              sx={{ padding: 0 }}
              className="message_complaint_btn"
              disableRipple
              disableFocusRipple
              onClick={handleComplaint}
            >
              <FlagIcon fontSize="small" />
            </IconButton>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

const ChatComponent: React.FC<ChatComponentProps> = ({
  messages,
  roomUsers,
  handleSubmit,
  roomClosed,
  handleFindNewRoom,
  handleComplaint
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  type MessageInfoProps = {
    text: string;
  };

  const MessageInfo: React.FC<MessageInfoProps> = ({ text }) => {
    return (
      <Box paddingX={"12px"} paddingY={"6px"}>
        {text}
      </Box>
    );
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "80vh",
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid gray",
      }}
    >
      <Box
        sx={{
          backgroundColor: "rgb(25, 118, 210)",
          height: "10%",
          boxSizing: "border-box",
          borderBottom: "1px solid gray",
          padding: "24px",
          color: "white",
          textAlign: "center",
          fontWeight: "600",
        }}
      >
        <h3 style={{ margin: 0 }}>Room</h3>
      </Box>
      <Box
        sx={{
          height: "80%",
          boxSizing: "border-box",
          borderBottom: "1px solid gray",
          paddingInline: "24px",
          display: "flex",
          justifyContent: "start",
          alignItems: "start",
          flexDirection: "column",
          overflowY: "auto",
        }}
        ref={chatBoxRef}
      >
        {messages.map((msg, i, arr) => {
          switch (message_type_index_to_type[msg.type]) {
            case "text":
              const prevMessage = arr[i - 1];

              const roomUser = roomUsers.find(
                (ru: RoomUser) => ru.id === msg.sender_id
              );

              const dataTime = convertDateTime(
                msg.timestamp,
                Math.abs(new Date().getTimezoneOffset() / 60)
              );

              const isMessageFirst =
                prevMessage !== undefined
                  ? prevMessage.sender_id !== msg.sender_id
                  : true;

              console.log(isMessageFirst);

              const props: MessageTextProps = {
                text: msg.text,
                username:
                  isMessageFirst && roomUser?.username
                    ? roomUser.username
                    : undefined,
                avatar_url:
                  isMessageFirst && roomUser?.avatar_url
                    ? roomUser.avatar_url
                    : undefined,
                time:
                  isMessageFirst && roomUser
                    ? padZeroes(dataTime.hour) +
                      ":" +
                      padZeroes(dataTime.minute)
                    : undefined,
                isFirst: isMessageFirst,
              };

              console.log(props);

              return (
                <MessageText
                  {...props}
                  key={msg.id}
                  {...(handleComplaint && user.info?.id !== msg.sender_id && {
                    handleComplaint:()=>handleComplaint(msg.sender_id,msg.id),
                  })}
                />
              );
            case "info":
              return <div></div>;
            default:
              return <></>;
          }
        })}
      </Box>
      <Box sx={{ height: "10%", boxSizing: "border-box" }}>
        {roomClosed ? (
          <Box
            sx={{
              mt: 1,
              padding: "16px",
              height: "100%",
              boxSizing: "border-box",
              margin: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <Typography sx={{ textAlign: "center" }}>Room closed</Typography>
            <Button onClick={handleFindNewRoom}>Find new room</Button>
          </Box>
        ) : (
          <Box
            component="form"
            onSubmit={(e) => {
              handleSubmit(e);
              if (inputRef.current) inputRef.current.value = "";
            }}
            sx={{
              mt: 1,
              padding: "16px",
              height: "100%",
              boxSizing: "border-box",
              margin: 0,
            }}
          >
            <TextField
              margin="none"
              required
              fullWidth
              name="message"
              type="text"
              id="message"
              sx={{ height: "100%", boxSizing: "border-box" }}
              InputProps={{ style: { height: "100%" } }}
              inputRef={inputRef}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

const Chat = () => {
  const user = useAppSelector(selectUser);
  const userStatus = useAppSelector(selectUserStatus);
  const dispatch = useAppDispatch();
  const cookie = new Cookies();

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsReadyState, setWsReadyState] = useState<number | null>(null);
  const [roomFound, setRoomFound] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [roomClosed, setRoomClosed] = useState<boolean>(false);
  const [roomId,setRoomId] = useState<number|null>(null);

  const findRoomFormHandler = async (data: FindRoomFormSubmitData) => {
    const message = {
      type: "find_room",
      data: {
        auth: {
          access_token: cookie.get("acs"),
        },
        preferences: data,
      },
    };

    ws?.send(JSON.stringify(message));

    console.log(message);
  };

  const chatFormHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log(event);

    const data = new FormData(event.currentTarget);

    const message = {
      type: "send_message",
      data: {
        auth: {
          access_token: cookie.get("acs"),
        },
        message: {
          text: data.get("message") as string,
          to_message_id: null,
          type: 0,
        },
      },
    };

    ws?.send(JSON.stringify(message));
  };

  const findNewRoomHandler = async () => {
    setRoomClosed(false);
    setRoomFound(false);
    setMessages([]);
    setRoomUsers([]);
  };

  const complaintHandler = (target_id: number, message_id?: string) => {
    const target = roomUsers.find((rm) => rm.id === target_id);
    
    dispatch(
      setComplaintWindow({
        target: {
          ...(message_id
            ? {
                message: message_id
                  ? messages.find((m) => m.id === message_id)
                  : undefined,
                username: target?.username,
                avatar_url: target?.avatar_url,
              }
            : { user_id: target_id }),
        },
        room_id:roomId
      })
    );
  };

  useEffect(() => {
    if (user.loggedIn) {
      try {
        const newWs = new WebSocket(config.WEBSOCKET_BASE_URL);

        newWs.onopen = () => setWsReadyState(newWs.readyState);
        // newWs.onclose = () => setWsReadyState(newWs.readyState);

        newWs.onmessage = async (e) => {
          const data = await JSON.parse(e.data);
          console.log(data);

          switch (data.type) {
            case "room_searching": {
              setRoomFound(data.data.room_found);
              setRoomId(data.data.room_id);

              console.log(data.data.room_id);

              if (data.data.room_found) {
                setRoomUsers(data.data.users);
              }
              break;
            }
            case "new_message": {
              setMessages((prev) => [...prev, data.data.message]);
              break;
            }
            case "room_closed": {
              setRoomClosed(true);
              break;
            }
          }
        };

        setWs(newWs);

        return () => {
          newWs.close();
        };
      } catch (error: any) {
        console.error(error);

        dispatch(showNotification({ message: error.toString() }));
      }
    } else if (userStatus !== "loading") {
      window.location.assign("/signin");
    }
  }, [userStatus, user]);

  console.log(messages.length);

  return (
    <Container maxWidth={"sm"} sx={{ paddingTop: "24px" }}>
      {wsReadyState === 1 ? (
        roomFound ? (
          <ChatComponent
            messages={messages}
            roomUsers={roomUsers}
            handleSubmit={chatFormHandler}
            roomClosed={roomClosed}
            handleFindNewRoom={findNewRoomHandler}
            handleComplaint={complaintHandler}
          />
        ) : (
          <Box>
            <Typography variant="h4" width={"100%"} textAlign={"center"}>
              Preferences
            </Typography>
            <FindRoomForm handleSubmit={findRoomFormHandler} />
          </Box>
        )
      ) : (
        "LOADING..."
      )}
    </Container>
  );
};

export default Chat;
