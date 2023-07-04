import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { selectUser, selectUserStatus } from "../features/user/userSlice";
import Cookies from "universal-cookie";
import { axiosClient } from "../Utils";
import config from "../config.json";
import { useScreenOrientation } from "../hooks";
import { isMobile } from "react-device-detect";

function Header() {
  const user = useAppSelector(selectUser);
  const userStatus = useAppSelector(selectUserStatus);
  const navigate = useNavigate();
  const orientation = useScreenOrientation();

  const pages = [
    {
      title: "Chat",
      action: () => {
        navigate("/chat");
      },
    },
  ];

  type Setting={
    title:string;
    action:()=>any;
    check?:()=>boolean;
  }
  
  const settings_loggedIn:Setting[] = [
    {
      title: "Profile",
      action: () => {
        navigate("/profile");
      },
    },
    {
      title: "Logout",
      action: async () => {
        // const cookie = new Cookies();

        // cookie.remove("acs");
        // cookie.remove("rfs");
        // cookie.remove("connect.sid");

        await axiosClient
          .post(config.SERVER_BASE_URL + "auth/logout")
          .catch(() => {});

        window.location.reload();
      },
    },
    {
      title:"Admin",
      action:async()=>{
        navigate("/admin");
      },
      check:()=>true
    }
  ];
  const settings_loggedOut:Setting[] = [
    {
      title: "Sign in",
      action: () => {
        navigate("/signin");
      },
    },
  ];

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null
  );
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: 100, height: orientation.includes('landscape')&&isMobile?"8vw":"8vh" }}>
      <Container sx={{ height: "100%" }}>
        <Toolbar
          disableGutters
          sx={{
            height: "100%",
            minHeight: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {/* <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} /> */}
          <Box sx={{display: { xs: "none", md: "flex" },flexDirection:'row',height:"100%"}}>
            <Box
              sx={{
                mr: 2,
                display: "flex",
              }}
            >
              <Link
                to="/"
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: ".3rem",
                  color: "inherit",
                  textDecoration: "none",
                  display:'flex',
                  alignItems:'center'
                }}
              >
                <h1 style={{margin:0}}>ANCHAT</h1>
              </Link>
            </Box>
            <Box sx={{display:"flex"}}>
              {pages.map((page) => (
                <Button
                  key={page.title}
                  onClick={() => {
                    handleCloseNavMenu();
                    page.action();
                  }}
                  sx={{ my: 2, color: "white", display: "block" }}
                >
                  {page.title}
                </Button>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.title}
                  onClick={() => {
                    handleCloseNavMenu();
                    page.action();
                  }}
                >
                  <Typography textAlign="center">{page.title}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          {/* <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} /> */}
          <Box
            sx={{
              // mr: 2,
              display: { xs: "flex", md: "none" },
            }}
          >
            <Link
              to="/"
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <h1 style={{ margin: 0 }}>ANCHAT</h1>
            </Link>
          </Box>

          <Box sx={{ flexGrow: 0, flexDirection: "row", display: "flex" }}>
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar
                alt={user.info?.username}
                src={user.info?.avatarUrl || ""}
              >
                {user.info?.username[0]}
              </Avatar>
            </IconButton>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {userStatus !== "loading" &&
                (user.loggedIn ? settings_loggedIn : settings_loggedOut).map(
                  (setting) => 
                    (!setting.check || setting.check())&&
                    <MenuItem
                    key={setting.title}
                    onClick={() => {
                      setting.action();
                      handleCloseUserMenu();
                    }}
                  >
                    {/* <Link to={"/asd"}> */}
                    <Typography textAlign="center">
                      {setting.title}
                    </Typography>
                    {/* </Link> */}
                  </MenuItem>
                )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default Header;
