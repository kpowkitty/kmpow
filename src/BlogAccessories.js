import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useState, useEffect } from "react";
import { Toolbar, IconButton, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './BlogAccessories.css';

function BlogAccessories() {
  const [showButton, setShowButton] = useState(false);
  const navigate = useNavigate();

  const handleScroll = () => {
    if (window.scrollY > 200) {
      setShowButton(true);
    } else {
      setShowButton(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Box className="blog-container"
      disableGutters
      maxWidth={false}
    >
        <IconButton 
          onClick={() => handleNavigation("/")}
        >
          <ArrowBackIosIcon className='back-button' />
        </IconButton>
        <div className={`scroll-top-button ${showButton ? 'visible' : ''}`}>
          <IconButton 
            onClick={scrollToTop}
          >
            <KeyboardArrowUpIcon className='up-button' />
          </IconButton>
        </div>
      </Box>
  );
}

export default BlogAccessories;
