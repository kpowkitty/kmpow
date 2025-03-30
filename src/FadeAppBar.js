import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import { useNavigate, useLocation } from 'react-router-dom';

const FadeAppBar = ({ position = "top" }) => {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // For top bar: hide when scrolling down, show when scrolling up
      if (position === "top") {
        if (currentScrollY > lastScrollY && visible && currentScrollY > 100) {
          setVisible(false);
        } else if (currentScrollY < lastScrollY && !visible) {
          setVisible(true);
        }
      } 
      // For bottom bar: hide when scrolling up, show when scrolling down
      else {
        if (currentScrollY < lastScrollY && visible && currentScrollY < document.body.scrollHeight - window.innerHeight - 100) {
          setVisible(false);
        } else if (currentScrollY > lastScrollY && !visible) {
          setVisible(true);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, visible, position]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isHomePage = location.pathname === "/";

  return (
    <>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        color="transparent"
        elevation={0}
        sx={{
          top: position === "top" ? 0 : "auto",
          bottom: position === "bottom" ? 0 : "auto",
          transition: "transform 0.3s ease-in-out",
          transform: visible ? "translateY(0)" : position === "top" ? "translateY(-100%)" : "translateY(100%)",
          backdropFilter: "blur(5px)",
          height: "64px",
          zIndex: 1200,
          background: "transparent",
        }}
      >
        <Toolbar>
          {position === "top" ? (
            <>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#9b3dff" }}>
                kat's blog
              </Typography>
              <Box>
                <IconButton 
                  color="inherit" 
                  onClick={() => handleNavigation("/")}
                  sx={{ 
                    color: isHomePage ? "#9b3dff" : "#fff",
                    "&:hover": { color: "#9b3dff" }
                  }}
                >
                  <HomeIcon />
                </IconButton>
                <IconButton 
                  color="inherit"
                  onClick={() => handleNavigation("/about")}
                  sx={{ 
                    color: location.pathname === "/about" ? "#9b3dff" : "#fff",
                    "&:hover": { color: "#9b3dff" }
                  }}
                >
                  <InfoIcon />
                </IconButton>
                <IconButton 
                  color="inherit"
                  onClick={() => handleNavigation("/contact")}
                  sx={{ 
                    color: location.pathname === "/contact" ? "#9b3dff" : "#fff",
                    "&:hover": { color: "#9b3dff" }
                  }}
                >
                  <ContactMailIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <Typography variant="body2" sx={{ color: "#fff", opacity: 0.7 }}>
                  © 2025 kmpow | @kpowkitty
                </Typography>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Extended Gradient Shadow */}
      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          top: position === "top" ? 0 : "auto",
          bottom: position === "bottom" ? 0 : "auto",
          height: position === "top" ? "35vh" : "35vh",
          background: position === "top" 
            ? "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 20%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0) 100%)"
            : "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 20%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0) 100%)",
          pointerEvents: "none", // Allows clicks to pass through to stars
          zIndex: 1100,
          transition: "opacity 0.3s ease-in-out",
          opacity: visible ? 1 : 0,
        }}
      />
    </>
  );
};

export default FadeAppBar;
