import React from 'react';
import { Box, Typography } from '@mui/material';
import TwinklyStars from './TwinklyStars';

const LoadingStars = ({ message = 'Loading...', starCount = 50 }) => (
  <Box sx={{ minHeight: '100vh', position: 'relative', backgroundColor: 'black', color: '#9b3dff' }}>
    <TwinklyStars starCount={starCount} />

    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          color: '#fff',
          textShadow: '0 0 8px rgba(0,0,0,0.8), 0 0 16px rgba(0,0,0,0.6)',
        }}
      >
        {message}
      </Typography>
    </Box>
  </Box>
);

export default LoadingStars;
