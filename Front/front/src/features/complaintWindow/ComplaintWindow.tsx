import { ChangeEvent, useEffect, useState } from "react";
import { MessageText } from "../../pages/Chat";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { closeComplaintWindow } from "./complaintWindowSlice";
import { convertDateTime, padZeroes } from "../../Utils";
import { Complaint } from "../../types/simplifiedDatabase";
import { selectUser } from "../user/userSlice";
import { createComplaint } from "./complaintWindowAPI";
import { showNotification } from "../notification/notificationSlice";

// type ComplaintWindowProps = {
//     message?: Message;
//     target_id?: number;
//     type: "message" | "user";
//   };

const ComplaintWindow = () => {
  const complaintValue = useAppSelector((state) => state.complaintWindow.value);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleClose = () => {
    setOpen(false);
    
    setTimeout(() => {
      dispatch(closeComplaintWindow());
      setIsSent(false);
    }, 500);
  };

  const handleSend:React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    
    if (user.info && complaintValue.target && complaintValue.room_id) {
      const complaint: Complaint = {
        reason: parseInt(reason),
        description:description||null,
        creator_id: user.info.id,
        to_message_id:
          "message" in complaintValue.target
            ? complaintValue.target.message.id
            : null,
        target_id:
          "message" in complaintValue.target
            ? complaintValue.target.message.sender_id
            : complaintValue.target?.user_id,
        room_id: complaintValue.room_id,
        id: 0,
        closed: false,
      };
      try {
        const res = await createComplaint(complaint);

        console.log(res);
        
        setIsSent(true);
      } catch (error: any) {
        console.error(error);

        dispatch(
          showNotification({
            message: error.toString(),
            type: "error",
          })
        );
      }
    } else{
      dispatch(
        showNotification({
          message: "Not enough data",
          type: "error",
        })
      );
    }
  };

  const handleChangeReason = (event: SelectChangeEvent) =>
    setReason(event.target.value as string);

  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>) =>
    setDescription(event.target.value as string);

  useEffect(() => {
    setOpen(!!complaintValue.target);
  }, [complaintValue.target]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{ style: { minWidth: "50vw" } }}
    >
      <form onSubmit={handleSend}>
        <DialogTitle>Create Complaint</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} flexDirection={"column"}>
            {complaintValue.target && "message" in complaintValue.target && (
              <Grid item xs>
                <Paper elevation={3} sx={{ padding: "12px" }}>
                  <MessageText
                    time={(() => {
                      const dataTime = convertDateTime(
                        complaintValue.target.message.timestamp,
                        Math.abs(new Date().getTimezoneOffset() / 60)
                      );
                      return (
                        padZeroes(dataTime.hour) +
                        ":" +
                        padZeroes(dataTime.minute)
                      );
                    })()}
                    text={complaintValue.target.message.text}
                    username={complaintValue.target.username}
                    avatar_url={complaintValue.target.avatar_url}
                    urls={false}
                    blockMargin={false}
                  />
                </Paper>
              </Grid>
            )}

            {isSent ? (
              <Grid item xs display='flex' justifyContent='center' alignItems='center'>
                <h3 style={{padding:'24px'}}>Complaint created</h3>
              </Grid>
            ) : (
              <Grid item xs>
                <FormControl
                  sx={{ minWidth: 120, boxSizing: "border-box", width: "100%" }}
                >
                  <Select
                    value={reason}
                    onChange={handleChangeReason}
                    displayEmpty
                    inputProps={{ "aria-label": "Without label" }}
                    required
                  >
                    <MenuItem value="">
                      <em>Reason</em>
                    </MenuItem>
                    <MenuItem value={0}>Aaa</MenuItem>
                    <MenuItem value={1}>Bbb</MenuItem>
                    <MenuItem value={2}>Ccc</MenuItem>
                  </Select>
                  <TextField
                    margin="dense"
                    id="description"
                    label="Description"
                    type="text"
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={5}
                    value={description}
                    onChange={handleDescriptionChange}
                  />
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          { !isSent && <Button type="submit">Send</Button> }
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ComplaintWindow;
