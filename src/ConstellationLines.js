import React, { useEffect, useState, useRef } from 'react';
import { Box } from '@mui/material';

const ConstellationLines = ({ stars, starSize = 30 }) => {
  const [lines, setLines] = useState([]);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    console.log('ConstellationLines received stars:', stars);
    
    if (!stars || stars.length === 0) {
      console.log('No stars provided');
      return;
    }

    // Group stars by category
    const categorized = {};
    stars.forEach(star => {
      if (!categorized[star.category]) {
        categorized[star.category] = [];
      }
      categorized[star.category].push(star);
    });

    console.log('Categorized stars:', categorized);

    // Calculate offset to center of star (starSize / 2 converted to percentage)
    const offsetX = (starSize / 2 / viewportSize.width) * 100;
    const offsetY = (starSize / 2 / viewportSize.height) * 100;

    // Create lines connecting stars within each category
    const allLines = [];
    Object.values(categorized).forEach(categoryStars => {
      // Sort by order if provided, otherwise use array order
      const sorted = [...categoryStars].sort((a, b) => 
        (a.order || 0) - (b.order || 0)
      );

      // Connect consecutive stars in the category
      for (let i = 0; i < sorted.length - 1; i++) {
        const star1 = sorted[i];
        const star2 = sorted[i + 1];

        if (star1.position && star2.position) {
          allLines.push({
            x1: star1.position.x + offsetX,
            y1: star1.position.y + offsetY,
            x2: star2.position.x + offsetX,
            y2: star2.position.y + offsetY,
            id: `${star1.id}-${star2.id}`,
          });
        }
      }
    });

    console.log('Generated lines:', allLines);
    setLines(allLines);
  }, [stars, viewportSize, starSize]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {lines.map((line, index) => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#2cfc03"
            strokeWidth="0.6"
            filter="url(#glow)"
            vectorEffect="non-scaling-stroke"
            style={{
              animation: `shimmer ${3 + (index % 3)}s infinite ease-in-out`,
              animationDelay: `${index * 0.2}s`,
            }}
          />
        ))}
      </svg>

      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </Box>
  );
};

export default ConstellationLines;
