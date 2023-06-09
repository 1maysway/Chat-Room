import { Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Notification from '../features/notification/Notification';
import ComplaintWindow from "../features/complaintWindow/ComplaintWindow";


const MainLayout: React.FC = () => {
  
    return (
      <div className="wrapper" style={{minWidth:'350px'}}>
          <Notification />
          <ComplaintWindow />
          <Header />
          <Container className="container" disableGutters={true}>
            <div className="content" style={{paddingTop:0}}>
                <Outlet />
            </div>
          </Container>
          <footer className='footer'>
            <Container className='footer_container' disableGutters={true}>
              
            </Container>
          </footer>
      </div>
    );
  };
  
  export default MainLayout;