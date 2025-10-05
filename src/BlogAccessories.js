import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useState, useEffect } from "react";
import { Toolbar, IconButton, Box } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import './BlogAccessories.css';

function BlogAccessories() {
  const [showButton, setShowButton] = useState(false);
  const [prevBlog, setPrevBlog] = useState(null);
  const [nextBlog, setNextBlog] = useState(null);
  const [isFirst, setIsFirst] = useState(false);
  const navigate = useNavigate();
  const { slug } = useParams();

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

  useEffect(() => {
    const fetchConstellationNav = async () => {
      try {
        // Fetch current blog
        const currentRes = await fetch(`/api/blogs/${slug}/`);
        const currentBlog = await currentRes.json();

        // Fetch all blogs
        const allRes = await fetch('/api/blogs/');
        const allBlogs = await allRes.json();

        // Filter blogs in same category and sort by order (or default to 0)
        const sameCategoryBlogs = allBlogs
          .filter(blog => blog.category === currentBlog.category)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Find current blog index in constellation
        const currentIndex = sameCategoryBlogs.findIndex(blog => blog.slug === slug);

        // Determine previous and next blogs
        if (currentIndex > 0) {
          setPrevBlog(sameCategoryBlogs[currentIndex - 1]);
          setIsFirst(false);
        } else {
          setPrevBlog(null);
          setIsFirst(true);
        }

        if (currentIndex < sameCategoryBlogs.length - 1) {
          setNextBlog(sameCategoryBlogs[currentIndex + 1]);
        } else {
          setNextBlog(null);
        }
      } catch (error) {
        console.error('Error fetching constellation navigation:', error);
      }
    };

    if (slug) {
      fetchConstellationNav();
    }
  }, [slug]);

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
      {/* Left Arrow - Goes to previous or home */}
      <IconButton
        onClick={() => handleNavigation(isFirst || !prevBlog ? "/" : `/content/${prevBlog.slug}`)}
        sx={{ position: 'fixed', top: '12vh', left: 32, right: 'auto', zIndex: 1000 }}
      >
        <ArrowBackIosIcon className='back-button' />
      </IconButton>

      {/* Right Arrow - Only shows if there's a next blog */}
      {nextBlog && (
        <IconButton
          onClick={() => handleNavigation(`/content/${nextBlog.slug}`)}
          sx={{ position: 'fixed', top: '12vh', right: 16, left: 'auto', zIndex: 1000 }}
        >
          <ArrowForwardIosIcon sx={{ color: '#7E00E6', fontSize: '26px' }} />
        </IconButton>
      )}

      {/* Scroll to top button */}
      <IconButton
        onClick={scrollToTop}
        sx={{
          position: 'fixed',       // make bottom work
          bottom: '12vh',          // distance from bottom
          right: 32,                // distance from left
          zIndex: 1500,            // above fade bar
          display: showButton ? 'flex' : 'none' // toggle visibility
        }}
      >
        <KeyboardArrowUpIcon className='up-button' />
      </IconButton>

    </Box>
  );
}

export default BlogAccessories;
