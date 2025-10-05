import React from 'react';
import { BrowserRouter as Router, useLocation, Routes, Route } from 'react-router-dom';
import FadeAppBar from './FadeAppBar';
import TwinklyStars from './TwinklyStars';
import StarFieldContent from './Stars';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import AppRouter from './AppRouter';

function AppContent() {
  const location = useLocation();

  const pageKey = location.pathname;

  // determine number of stars based on route
  let starCount;
  switch(location.pathname) {
    case '/':
    case '/resume':
    case '/blog':
      starCount = 300;
      break;
    case '/about':
      starCount = 150;
      break;
    case '/contact':
      starCount = 150;
      break;
    default:
      starCount = 40;
  }
  
  return (
    <>
      <FadeAppBar position="top" />
      <div style={{ 
        position: 'fixed', 
        top: 0, left: 0, width: '100vw', height: '100vh', 
        backgroundColor: 'black', 
        zIndex: 0, 
        pointerEvents: 'none' 
      }} />
      <TwinklyStars count={starCount} pageKey={pageKey} />
      <AppRouter />
      <FadeAppBar position="bottom" />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
