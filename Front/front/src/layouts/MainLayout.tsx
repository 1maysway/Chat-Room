import {
  Box,
  Container,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { Link, Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Notification from "../features/notification/Notification";
import ComplaintWindow from "../features/complaintWindow/ComplaintWindow";
import { useScreenOrientation } from "../hooks";
import { isMobile } from "react-device-detect";
import "../style/components/mainLayout.css";

const pagesWithoutFooter = ["/chat", "/email-confirm"];

type LinkObj = {
  href: string;
  content: React.ReactNode;
};

type FooterSection = {
  title: string;
  links: LinkObj[];
};

const footerSections: FooterSection[] = [
  {
    title: "Support",
    links: [
      {
        href: "https://vk.com/",
        content: "VK",
      },
      {
        href: "https://t.me/",
        content: "Telegram",
      },
      {
        href: "https://mail.google.com/",
        content: "Email",
      },
    ],
  },
  {
    title: "Support",
    links: [
      {
        href: "https://vk.com/",
        content: "VK",
      },
      {
        href: "https://t.me/",
        content: "Telegram",
      },
      {
        href: "https://mail.google.com/",
        content: "Email",
      },
    ],
  },
  {
    title: "Support",
    links: [
      {
        href: "https://vk.com/",
        content: "VK",
      },
      {
        href: "https://t.me/",
        content: "Telegram",
      },
      {
        href: "https://mail.google.com/",
        content: "Email",
      },
    ],
  },
  {
    title: "Support",
    links: [
      {
        href: "https://vk.com/",
        content: "VK",
      },
      {
        href: "https://t.me/",
        content: "Telegram",
      },
      {
        href: "https://mail.google.com/",
        content: "Email",
      },
    ],
  },
];

const MainLayout: React.FC = () => {
  const location = useLocation();
  const orientation = useScreenOrientation();

  return (
    <div
      className="wrapper"
      style={{
        minWidth: "350px",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Notification />
      <ComplaintWindow />
      <Header />
      <Container
        disableGutters={true}
        sx={{
          height: "100%",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          mt: orientation.includes("landscape") && isMobile ? "8vw" : "8vh",
        }}
      >
        <Box
          style={{
            paddingTop: 0,
            height: "100%",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            minHeight:
              orientation.includes("landscape") && isMobile
                ? "100vh - 8vw"
                : "92vh",
          }}
        >
          <Outlet />
        </Box>
      </Container>
      {!pagesWithoutFooter.includes(location.pathname) && (
        <footer
          className="footer"
          style={{
            borderTop: "2px solid black",
            height: "300px",
            marginTop: "96px",
          }}
        >
          <Container className="footer_container" disableGutters={true} sx={{paddingBlock:'24px'}}>
            <Grid container columnSpacing={0}>
              {footerSections.map((fs, i) => (
                <Grid item xs key={i}>
                  <Box sx={{paddingBlock:'24px',borderRight:`${i<footerSections.length-1?2:0}px solid black`}}>
                    <Box sx={{paddingInline:'24px'}}>
                      <h2 style={{marginTop:0}}>{fs.title}</h2>
                    </Box>
                    <Box>
                      <List>
                        {fs.links.map((fsLink, i) => (
                          <ListItem
                            // style={style}
                            // key={index}
                            component="div"
                            disablePadding
                            key={i}
                          >
                            <Link
                              to={fsLink.href}
                              target="_blank"
                              style={{
                                textDecoration: "none",
                                width: "100%",
                                paddingInline:'24px'
                              }}
                              className="footer_link"
                            >
                              <ListItemText primary={fsLink.content} />
                            </Link>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </footer>
      )}
    </div>
  );
};

export default MainLayout;
