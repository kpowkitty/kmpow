import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Route, Routes, Outlet, useNavigate } from 'react-router-dom';
import ActionAreaCard from './ActionAreaCard';
import BlogPage from './BlogPage';
import { AppBar, Toolbar, IconButton, Typography, SvgIcon, Box } from '@mui/material';
import './App.css';

// Home Icon Component
function HomeIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </SvgIcon>
  );
}

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        backgroundColor: "white",
        boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        height: "20px",
      }}
    >
      <Box>
        <img
          src="/FREEBSD_Logo_Horiz_Pos_RGB.png"
          alt="FreeBSD Logo"
          style={{ height: 30 }}
        />
      </Box>
      <Typography
        variant="body2"
        sx={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        © 2025 kmpow ᓚᘏᗢ
      </Typography>
    </Box>
  );
}

// Layout Component with AppBar
function Layout() {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <div className="app-layout">
      <AppBar 
        position="static" 
        color="transparent" 
        elevation={0}
        sx={{ 
          width: '100%',
          margin: 0,
          padding: 0,
        }}
      >
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            aria-label="home"
            onClick={handleHomeClick}
            sx={{ 
              mr: 2,
            }}
          >
            <HomeIcon 
              sx={{
                textAlign: 'center',
                margin: '0 auto',
                paddingBottom: '35px',
              }}
            />
          </IconButton>
          <Typography 
            variant="h2" 
            component="div" 
            sx={{
              color: '#fbf1c7',
              fontFamily: 'Source Sans 3',
              margin: '0 auto',
              fontSize: '20px',
              width: 'fit-content',
              paddingRight: '24px',
              paddingBottom: '35px',
            }}
          >
            <h1>kat's blog</h1>
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Outlet />
      
      <footer>
        <Footer />
      </footer>
    </div>
  );
}

function HomePage() {
  const blogs = [
    {
      slug: "kyua-test",
      title: "Kyua Testing in a UFS FreeBSD Jail",
      desc: "A detailed guide on how to set up a UFS FreeBSD Jail for running Kyua tests.",
      image: "kyua-test",
    },
    {
      slug: "storybook",
      title: "Storybook: A Two Part Tale",
      desc: "My adventures with Storybook under a micro-internship with CTI/Code Day.",
      image: "storybook-icon",
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
        {blogs.map((blog, index) => (
          <ActionAreaCard
            key={index}
            title={blog.title}
            desc={blog.desc}
            image={`/static/images/cards/${blog.image}.png`}
            blogLink={blog.slug}
          />
        ))}       
      </div>
    </div>
  );
}

const theme = createTheme({
  typography: {
    fontFamily: '"Source Sans 3", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Index route for home page */}
          <Route index element={<HomePage />} />
          
          {/* Route for individual blog posts */}
          <Route path="content/:slug" element={<BlogPage />} />
        </Route>
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;
