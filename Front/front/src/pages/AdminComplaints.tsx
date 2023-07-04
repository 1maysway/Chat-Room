import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Paper,
} from "@mui/material";
import { Complaint } from "../types/simplifiedDatabaseTypes";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { axiosClient } from "../Utils";
import config from "../config.json";

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [closed, setClosed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    axiosClient
      .post(config.SERVER_BASE_URL + "admin/complaints")
      .then((res) => {
        setComplaints(res.data.data.complaints);
        setIsLoading(false);
        setCount(res.data.data.count);
      })
      .catch(console.error);
  }, []);

  const loadMoreHandler = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.post(
        config.SERVER_BASE_URL + "admin/complaints",
        {
          offset: complaints.length,
          closed,
        }
      );

      console.log(res);

      setComplaints((prev) => [...prev, ...res.data.data.complaints]);
      setCount(res.data.data.count);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

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
      <Box>
        <h1>Complaints</h1>
      </Box>
      <Box
        sx={{
          width: "100%",
          padding: "24px",
          border: "2px solid black",
          boxSizing: "border-box",
          backgroundColor: "lightgray",
          marginBlock: "24px",
        }}
      >
        <Grid container spacing={2}>
          {complaints.map((com, i) => {
            return (
              <Grid item key={com.id} xs={12}>
                <Link to={com.id.toString()} style={{ textDecoration: "none" }}>
                  <Paper sx={{ padding: "12px" }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Box>
                        Reason: {com.reason}
                        </Box>
                        <Box>
                          Closed: {com.closed.toString()}
                        </Box>
                      </Grid>
                      {com.description && (
                        <Grid item xs>
                          <Box sx={{ whiteSpace: "normal", overflow: "clip" }}>
                            Description: {com.description}
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Link>
              </Grid>
            );
          })}
        </Grid>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        {count === complaints.length ? (
          <h3>No more complaints</h3>
        ) : (
          <Button
            variant="contained"
            onClick={loadMoreHandler}
            disabled={isLoading}
          >
            <Box sx={{ position: "relative" }}>
              <Box sx={{ opacity: isLoading ? 0 : 1 }}>Load more</Box>
              {isLoading && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: "-12px",
                    marginLeft: "-12px",
                  }}
                >
                  <CircularProgress size={24} />
                </Box>
              )}
            </Box>
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default AdminComplaints;
