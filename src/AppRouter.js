import { Routes, Route } from 'react-router-dom';
import BlogPage from "./BlogPage.js";
import AboutPage from "./AboutPage.js";
import ContactPage from "./ContactPage.js";
import ResumePage from "./ResumePage.js";
import StarFieldContent from "./Stars.js";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<StarFieldContent />} />
      <Route path="/content/:slug" element={<BlogPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/resume" element={<ResumePage />} />
    </Routes>
  );
}
