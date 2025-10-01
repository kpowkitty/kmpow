import React, { useEffect } from 'react';
import { Box, Typography, Paper, Container, Divider, Link } from '@mui/material';
import FadeAppBar from './FadeAppBar';
import { useLocation } from "react-router-dom";

const ResumePage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/resume") {
      document.body.style.overflow = "hidden";
    }

    return () => {
        document.body.style.overflow = "auto";
    };
  }, [location]);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: 'black',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: { xs: 2, md: 4 },
        pb: 10,
        pt: 10,
      }}
    >
      {/* App Bars */}
      <FadeAppBar position="top" />
      <FadeAppBar position="bottom" />

      {/* Star-like particles in background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {[...Array(50)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              backgroundColor: i % 5 === 0 ? '#9b3dff' : '#2cfc03',
              borderRadius: '50%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `twinkle ${Math.random() * 5 + 3}s infinite ease-in-out`,
              opacity: Math.random() * 0.5 + 0.5,
              boxShadow: i % 5 === 0 ? '0 0 10px #9b3dff' : '0 0 5px #2cfc03',
            }}
          />
        ))}
      </Box>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Title Section */}
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(155, 61, 255, 0.3)',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              color: '#9b3dff',
              fontWeight: 'bold',
              mb: 1,
            }}
          >
            Resume
          </Typography>
          <Typography
            variant="h5"
            sx={{
              textAlign: 'center',
              color: '#fff',
              fontWeight: 'normal',
            }}
          >
            Kayla Powell
          </Typography>
        </Paper>

        {/* Links Container */}
        <Paper
          elevation={6}
          sx={{
            padding: 2,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(155, 61, 255, 0.3)',
            borderRadius: 2,
            mb: 3,
            textAlign: 'center',
          }}
        >
          <Link
            href="https://www.github.com/kpowkitty"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: '#9b3dff',
              textDecoration: 'none',
              fontSize: '12pt',
              mr: 3,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            GitHub
          </Link>
          <Link
            href="https://www.linkedin.com/in/kpowkitty"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: '#9b3dff',
              textDecoration: 'none',
              fontSize: '12pt',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            LinkedIn
          </Link>
        </Paper>

        {/* Work Experience Section */}
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(155, 61, 255, 0.3)',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#9b3dff',
              fontWeight: 'bold',
              mb: 2,
            }}
          >
            TITLE
          </Typography>
          <Divider sx={{ bgcolor: 'rgba(155, 61, 255, 0.3)', mb: 3 }} />
          <Typography variant="body1" sx={{ color: '#fff' }}>
            DESCRIPTION
          </Typography>
        </Paper>

        {/* Projects Section */}
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(155, 61, 255, 0.3)',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#9b3dff',
              fontWeight: 'bold',
              mb: 2,
            }}
          >
            TITLE
          </Typography>
          <Divider sx={{ bgcolor: 'rgba(155, 61, 255, 0.3)', mb: 3 }} />
          <Typography variant="body1" sx={{ color: '#fff' }}>
            DESCRIPTION
          </Typography>
        </Paper>

        {/* Education Section */}
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(155, 61, 255, 0.3)',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#9b3dff',
              fontWeight: 'bold',
              mb: 2,
            }}
          >
            TITLE
          </Typography>
          <Divider sx={{ bgcolor: 'rgba(155, 61, 255, 0.3)', mb: 3 }} />
          <Typography variant="body1" sx={{ color: '#fff' }}>
            DESCRIPTION
          </Typography>
        </Paper>

        {/* Skills & Passions Section */}
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(155, 61, 255, 0.3)',
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#9b3dff',
              fontWeight: 'bold',
              mb: 2,
            }}
          >
            TITLE
          </Typography>
          <Divider sx={{ bgcolor: 'rgba(155, 61, 255, 0.3)', mb: 3 }} />
          <Typography variant="body1" sx={{ color: '#fff' }}>
            DESCRIPTION
          </Typography>
        </Paper>
      </Container>

      {/* CSS for twinkling animation */}
      <style>{`
        @keyframes twinkle {
          0% { opacity: 0.2; }
          50% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </Box>
  );
};

export default ResumePage;
