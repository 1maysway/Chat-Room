import { Box, Container, Grid } from "@mui/material";
import { useEffect, useState } from "react";
import { Complaint } from "../types/simplifiedDatabaseTypes";
import { axiosClient } from "../Utils";
import config from "../config.json";

const AdminComplaintsId = () => {
  const [complaint, setComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    axiosClient
      .get(
        config.SERVER_BASE_URL +
          "admin/complaints/" +
          parseInt(window.location.href.split("/").reverse()[0])
      )
      .then((res) => {
        console.log(res);
        setComplaint(res.data.data.complaint);
      })
      .catch(console.error);
  }, []);

  return (
    <Container
      sx={{
        height: "100%",
        flexGrow: 1,
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          width: "100%",
          padding: "24px",
          border: "2px solid black",
          boxSizing: "border-box",
          marginBlock: "24px",
        }}
      >
          <Grid container sx={{ width: "100%" }} spacing={2}>
            {Object.entries(complaint || {}).map(([key, val]) => {
              return (
                <Grid item xs={6} key={key}>
                  <Box sx={{whiteSpace:"normal",wordWrap:"break-word"}}>
                    {key}: {val}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
      </Box>
    </Container>
  );
};

export default AdminComplaintsId;
