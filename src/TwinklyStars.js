import React, { useMemo } from 'react';
import { Box } from '@mui/material';

const TwinklyStars = ({ count = 50, pageKey = 0 }) => {
  // regenerate stars whenever count or pageKey changes
  const stars = useMemo(() => {
    return [...Array(count)].map((_, i) => ({
      id: i,
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      color: i % 5 === 0 ? '#9b3dff' : '#2cfc03',
      top: Math.random() * 100,
      left: Math.random() * 100,
      animationDuration: Math.random() * 5 + 3,
      opacity: Math.random() * 0.5 + 0.5,
      boxShadow: i % 5 === 0 ? '0 0 10px #9b3dff' : '0 0 5px #2cfc03',
    }));
  }, [count, pageKey]);

  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0 }}>
      {stars.map((star) => (
        <Box
          key={star.id}
          sx={{
            position: 'absolute',
            width: star.width,
            height: star.height,
            backgroundColor: star.color,
            borderRadius: '50%',
            top: `${star.top}%`,
            left: `${star.left}%`,
            animation: `twinkle ${star.animationDuration}s infinite ease-in-out`,
            opacity: star.opacity,
            boxShadow: star.boxShadow,
          }}
        />
      ))}

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

export default React.memo(TwinklyStars);
