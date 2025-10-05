import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import ConstellationLines from "./ConstellationLines.js";

function StarFieldContent() {
  const [stars, setStars] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [hoveredStar, setHoveredStar] = useState(null);
  const navigate = useNavigate();

  // Fetch blogs and generate stars
  useEffect(() => {
    const fetchBlogs = async () => {
      const res = await fetch('/api/blogs/');
      const data = await res.json();
      const taken = [];

      const active = data.map(blog => {
        taken.push({ x: blog.position.x, y: blog.position.y });
        return { ...blog, position: blog.position, isActive: true };
      });

      const inactiveCount = windowWidth > 1000 ? 130 :
                            windowWidth > 800 ? 100 :
                            windowWidth > 600 ? 70 :
                            windowWidth > 400 ? 40 :
                            windowWidth > 200 ? 20 : 10;

      const inactive = Array.from({ length: inactiveCount }, (_, i) => {
        let x, y;
        do { x = Math.random()*100; y = Math.random()*100 } 
        while (taken.some(p => Math.abs(p.x-x)<5 && Math.abs(p.y-y)<5));
        taken.push({ x, y });
        return { id:`inactive-${i}`, position:{x,y}, size: Math.random()*19+1, isActive:false };
      });

      setStars([...active, ...inactive]);
    };

    fetchBlogs();
  }, [windowWidth]);

  // Track window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{
      position: 'fixed', top:0, left:0, width:'100vw', height:'100vh',
      overflow:'visible', zIndex: 1, pointerEvents:'none', backgroundColor:'transparent'
    }}>
      {/* Constellation lines */}
      <ConstellationLines stars={stars.filter(s => s.isActive)} style={{ pointerEvents:'none' }} />

      {stars.map(star => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            top: `${star.position.y}%`,
            left: `${star.position.x}%`,
            cursor: star.isActive ? 'pointer' : 'default',
            pointerEvents: 'auto'
          }}
          onMouseEnter={() => star.isActive && setHoveredStar(star)}
          onMouseLeave={() => setHoveredStar(null)}
        >
          <StarOutlinedIcon
            sx={{
              fontSize: star.isActive ? 30 : star.size,
              color: star.isActive ? "#43fc1e" : "#25d602",
              filter: star.isActive ? "drop-shadow(0 0 5px #43fc1e)" : "none",
              transition: 'transform 0.3s ease-in-out',
              "&:hover": star.isActive ? { transform: "scale(2)", filter:"drop-shadow(0 0 8px #43fc1e)" } : {}
            }}
            onClick={() => star.isActive && star.slug && navigate(`/content/${star.slug}`)}
          />

          {/* Tooltip as fixed element */}
          {star.isActive && hoveredStar === star && (
            <div style={{
              position: 'fixed',
              top: `${star.position.y}vh`,
              left: `${star.position.x}vw`,
              transform: 'translate(-50%, 30px)',
              backgroundColor: '#000',
              color: '#9b3dff',
              padding: '4px 8px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              fontSize: '12px',
              zIndex: 10,
              opacity: 1
            }}>
              {star.title}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default StarFieldContent;
