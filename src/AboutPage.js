import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Container, Divider } from '@mui/material';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import LoadingStars from './LoadingStars';
import './AboutPage.css';

const AboutPage = () => {
  const location = useLocation();
  const [aboutContent, setAboutContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.pathname === "/about") {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [location]);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const response = await axios.get('/api/about/');
        if (response.data && response.data.length > 0) {
          setAboutContent(response.data[0]); // pick the first (latest) entry
        }
      } catch (error) {
        console.error("Failed to fetch About content:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  if (loading) return <LoadingStars message="Loading About Page..." />;

  return (
    <Box
      className="about"
      sx={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: 'transparent',
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

      {/* Main Content */}
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
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
            {aboutContent.title || 'About Me'}
          </Typography>

          <Divider sx={{ bgcolor: 'rgba(155, 61, 255, 0.3)', my: 4 }} />

          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid rgba(155, 61, 255, 0.3)',
              backgroundColor: 'rgba(155, 61, 255, 0.05)',
            }}
          >
            {aboutContent.section_1 && (
              <Typography variant="body1" sx={{ color: '#fff', lineHeight: 1.8, mb: 2 }}>
                {aboutContent.section_1}
              </Typography>
            )}

            {aboutContent.section_2 && (
              <Typography variant="body1" sx={{ color: '#fff', lineHeight: 1.8, mb: 2 }}>
                {aboutContent.section_2}
              </Typography>
            )}

            {aboutContent.section_3 && (
              <Typography variant="body1" sx={{ color: '#fff', lineHeight: 1.8 }}>
                {aboutContent.section_3}
              </Typography>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AboutPage;
