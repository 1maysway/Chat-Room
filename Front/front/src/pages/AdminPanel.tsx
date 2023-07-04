import { Box, Button, Container, Grid } from "@mui/material";
import { Link } from "react-router-dom";


const AdminPanel = () =>{
    return <Container sx={{ height: "100%", flexGrow: 1, display: "flex",justifyContent:"center" }}>
        <Box sx={{padding:"96px"}}>
            <Grid container>
                <Grid item xs>
                    <Button variant="contained" component={Link} to="/admin/complaints">Complaints</Button>
                </Grid>
            </Grid>
        </Box>
    </Container>
}

export default AdminPanel;