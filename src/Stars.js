import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import starsData from "./static/stars.json";
import BlogPage from "./BlogPage"; // Import BlogPage component
import './Stars.css';
import FadeAppBar from "./FadeAppBar.js";
import ContactPage from "./ContactPage.js";

// StarField component that uses navigation
function StarFieldContent() {
  const [stars, setStars] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  // Function to generate random position for inactive stars, avoiding overlap with active stars
  const getRandomPosition = (takenPositions) => {
    let x, y;
    let overlap;

    do {
      x = Math.random() * 100;
      y = Math.random() * 100;

      // Ensure no overlap with already taken positions
      overlap = takenPositions.some(
        (pos) => Math.abs(pos.x - x) < 5 && Math.abs(pos.y - y) < 5
      );
    } while (overlap);

    takenPositions.push({ x, y });
    return { x, y };
  };

  // Function to generate a random size between 1px and 20px
  const getRandomSize = () => {
    return Math.random() * (20 - 1) + 1;
  };

  // Adjust the number of inactive stars based on screen width
  const calculateNumberOfInactiveStars = () => {
    if (windowWidth > 1000) {
      return 130;
    } else if (windowWidth > 800) {
      return 100;
    } else if (windowWidth > 600) {
      return 70;
    } else if (windowWidth > 400) {
      return 40;
    } else if (windowWidth > 200) {
      return 20;
    } else {
      return 10;
    }
  };

  useEffect(() => {
    const takenPositions = [];

    // Generate active stars with positions from the JSON file
    const activeStars = starsData.map((star) => {
      const position = {
        x: star.position.x,
        y: star.position.y,
      };

      // Ensure no overlap with other active stars
      takenPositions.push({ x: position.x, y: position.y });

      return { ...star, position, isActive: true };
    });

    // Generate inactive stars based on window size, ensuring they don't overlap with active stars
    const inactiveStars = Array.from({ length: calculateNumberOfInactiveStars() }, (_, i) => ({
      id: `inactive-${i}`,
      title: null,
      desc: null,
      slug: null,
      position: getRandomPosition(takenPositions),
      size: getRandomSize(),
      isActive: false,
    }));

    setStars([...activeStars, ...inactiveStars]);
  }, [windowWidth]);

  // Update the window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <FadeAppBar position="top" />
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          backgroundColor: "black",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >   
        {stars.map((star) => (
          <div
            key={star.id}
            style={{
              position: "absolute",
              top: `${star.position.y}%`,
              left: `${star.position.x}%`,
              display: "inline-block",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              cursor: star.isActive ? "pointer" : "default", // Add pointer cursor for active stars
            }}
          >
            <StarOutlinedIcon
              sx={{
                fontSize: star.isActive ? 20 : star.size,
                color: star.isActive ? "#9b3dff" : "#2cfc03",
                filter: star.isActive ? "drop-shadow(0 0 5px #9b3dff)" : "none", // Add glow effect for active stars
                "&:hover": star.isActive ? {
                  transform: "scale(1.2)",
                  filter: "drop-shadow(0 0 8px #9b3dff)", // Enhanced glow on hover
                } : {},
              }}
              onClick={() => {
                if (star.isActive && star.slug) {
                  console.log(`Navigating to: /content/${star.slug}`); // Debug log
                  navigate(`/content/${star.slug}`);
                }
              }}
            />
            {/* Optional tooltip to show star title on hover */}
            {star.isActive && star.title && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                  opacity: 0,
                  transition: "opacity 0.3s",
                  pointerEvents: "none",
                  fontSize: "12px",
                }}
                className="star-tooltip"
              >
                {star.title}
              </div>
            )}
          </div>
        ))}
      </div>
      <FadeAppBar position="bottom" />
    </>
  );
}

// Main component with routing
export default function StarField() {
  return (
    <div className="blog-wrapper">
      <Router>
        <Routes>
          <Route path="/" element={<StarFieldContent />} />
          <Route path="/content/:slug" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </Router>
    </div>
  );
}
