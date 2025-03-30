import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Paper, Container, Divider, TextField, Button, Alert } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import FadeAppBar from './FadeAppBar';

// Fetch CSRF Token from meta tag
const getCSRFToken = () => {
  return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
};

const ContactPage = () => {
  const [formStatus, setFormStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
     
  useEffect(() => {
    if (formStatus === 'success' || formStatus === 'error') {
      const timer = setTimeout(() => {
        setFormStatus('idle');
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [formStatus]); 
  
  const HandleSubmit = async (event) => {
    event.preventDefault();
    setFormStatus('submitting');
   
    const formData = {
    	name: event.target.name.value,
	email: event.target.email.value,
	message: event.target.message.value,
    };

    const csrfToken = getCSRFToken(); // Get CSRF token

    try {
      // Send the form data to Django backend via a POST request
      const response = await fetch('https://kmpow.com/send_message/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
	  'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setFormStatus('success');
      } else {
        setFormStatus('error');
      }
    } catch (error) {
      console.error('Error:', error);
      setFormStatus('error');
    }
  };

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
            Contact Me
          </Typography>
          
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 4, color: '#ccc' }}>
          </Typography>
          
          {/* Social Links */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 4 }}>
            <IconButton 
              aria-label="github" 
              size="large"
              href="https://github.com/kpowkitty" 
              target="_blank"
              sx={{ 
                color: 'white',
                '&:hover': { 
                  color: '#9b3dff',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <GitHubIcon fontSize="large" />
            </IconButton>
            
            <IconButton 
              aria-label="linkedin" 
              size="large"
              href="https://linkedin.com/in/kpowkitty" 
              target="_blank"
              sx={{ 
                color: 'white',
                '&:hover': { 
                  color: '#9b3dff',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <LinkedInIcon fontSize="large" />
            </IconButton>
          </Box>
          
          <Divider sx={{ bgcolor: 'rgba(155, 61, 255, 0.3)', my: 4 }} />
          
          {/* Contact Form */}
          <Box component="form" onSubmit={HandleSubmit}>
            <Typography variant="h5" sx={{ mb: 3, color: '#9b3dff' }}>
              Send a Message
            </Typography>

            {formStatus === 'success' && (
              <Alert 
                severity="success" 
                sx={{ mb: 3, '& .MuiAlert-message': { color: 'text.primary' } }}
              >
                Thank you for your message! I'll get back to you soon.
              </Alert>
            )}
            
            {formStatus === 'error' && (
              <Alert 
                severity="error"
                sx={{ mb: 3, '& .MuiAlert-message': { color: 'text.primary' } }}
              >
                Sorry, there was a problem sending your message. Please try again.
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Name"
              margin="normal"
              required
              variant="outlined"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(155, 61, 255, 0.5)' },
                  '&:hover fieldset': { borderColor: '#9b3dff' },
                  '&.Mui-focused fieldset': { borderColor: '#9b3dff' },
                },
                '& .MuiInputLabel-root': { color: '#ccc' },
                '& .MuiOutlinedInput-input': { color: 'white' },
              }}
            />
            
            <TextField
              fullWidth
              label="Email"
              margin="normal"
              required
              type="email"
              variant="outlined"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(155, 61, 255, 0.5)' },
                  '&:hover fieldset': { borderColor: '#9b3dff' },
                  '&.Mui-focused fieldset': { borderColor: '#9b3dff' },
                },
                '& .MuiInputLabel-root': { color: '#ccc' },
                '& .MuiOutlinedInput-input': { color: 'white' },
              }}
            />
            
            <TextField
              fullWidth
              label="Message"
              margin="normal"
              required
              multiline
              rows={4}
              variant="outlined"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(155, 61, 255, 0.5)' },
                  '&:hover fieldset': { borderColor: '#9b3dff' },
                  '&.Mui-focused fieldset': { borderColor: '#9b3dff' },
                },
                '& .MuiInputLabel-root': { color: '#ccc' },
                '& .MuiOutlinedInput-input': { color: 'white' },
              }}
            />
            
            <Button
              type="submit"
              variant="contained"
              endIcon={formStatus === 'submitting' ? null : <SendIcon />}
              disabled={formStatus === 'submitting'}
              sx={{
                bgcolor: '#9b3dff',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(155, 61, 255, 0.8)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(155, 61, 255, 0.5)',
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                py: 1.5,
              }}
            >
              {formStatus === 'submitting' ? 'Sending...' : 'Send Message'}
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* CSS for twinkling animation */}
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.2; }
          50% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </Box>
  );
};

export default ContactPage;
