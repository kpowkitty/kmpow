import React, { useEffect } from 'react';
import { Box, Typography, Paper, Container, Divider } from '@mui/material';
import FadeAppBar from './FadeAppBar';
import { useLocation } from "react-router-dom";
import './AboutPage.css';

const AboutPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/about") {
      document.body.style.overflow = "hidden";
    }

    return () => {
        document.body.style.overflow = "auto";
    };
  }, [location]);

  return (
    <Box className="about"
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
        pb: 10, // Add padding at bottom to account for app bar
        pt: 10, // Add padding at top to account for app bar
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
        {/* Generate 50 small stars */}
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
            variant="h3" 
            sx={{ 
              textAlign: 'center', 
              color: '#9b3dff',
              fontWeight: 'bold',
              mb: 1,
            }}
          >
            About Me
          </Typography>
          
          <Divider sx={{ bgcolor: 'rgba(155, 61, 255, 0.3)', my: 4 }} />
          
          {/* About Content */}
          <Box sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: '1px solid rgba(155, 61, 255, 0.3)',
            backgroundColor: 'rgba(155, 61, 255, 0.05)'
          }}>
            <Typography variant="body1" sx={{ color: '#fff', lineHeight: 1.8 }}>
              {/* Replace this with your bio */}
             My name is Kayla, but I go by Kat, Luna, or Bee. I am a junior computer
              scientist at San Francisco State University. I am currently a research
              assistant for Dr. El Alaoui and a software engineer intern for Planet
              Bee Foundation.
            </Typography>
            
            <Typography variant="body1" sx={{ color: '#fff', mt: 2, lineHeight: 1.8 }}>
              {/* Replace this with more about your skills */}
              I am a dedicated developer eager to learn all paradigms, but my true passion
              comes from operating systems. I daily drive Gentoo Linux, tinker with MacOS
              on my Macbook Air M3, and have a FreeBSD NAS (and yes, this is hosted
              on a FreeBSD NGINX server :) ).
            </Typography>
            
            <Typography variant="body1" sx={{ color: '#fff', mt: 2, lineHeight: 1.8 }}>
              {/* Replace this with your interests or goals */}
              Outside of my computers, I have a variety of hobbies: gel nails, drawing,
              flute, video games, and writing. You'll often find me at events for Planet
              Bee Foundation, growing the minds of our youngest generations into
              environmental conservationists. I hope you enjoy my blogs, and please
              send me a message if anything is out of order.
            </Typography>
          </Box>
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

export default AboutPage;
