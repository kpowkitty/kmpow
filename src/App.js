import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Route, Routes, Outlet, useNavigate } from 'react-router-dom';
import ActionAreaCard from './ActionAreaCard';
import BlogPage from './BlogPage';
import { AppBar, Toolbar, IconButton, Typography, SvgIcon } from '@mui/material';
import './App.css';

// Home Icon Component
function HomeIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </SvgIcon>
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
          width: '100%',  // Ensure full width
          margin: 0,      // Remove any margins
          padding: 0,     // Remove any padding
        }}
      >
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            aria-label="home"
            onClick={handleHomeClick}
            sx={{ mr: 2 }}
          >
            <HomeIcon />
          </IconButton>
          <Typography 
            variant="h2" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontFamily: 'Source Sans 3' 
            }}
          >
            kat's blog
          </Typography>
        </Toolbar>
      </AppBar>
      
      {/* Outlet will render child routes */}
      <Outlet />
      
      <footer>
        <p>© 2025 kmpow ᓚᘏᗢ</p>
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
