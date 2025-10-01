import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Container, Divider, Chip, Link } from '@mui/material';
import FadeAppBar from './FadeAppBar';
import { useLocation } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import './AboutPage.css';

const ResumePage = () => {
  const location = useLocation();
  const [workExperience, setWorkExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [education, setEducation] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.pathname === "/resume") {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [location]);

  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        const [workRes, projectsRes, educationRes, skillsRes] = await Promise.all([
          fetch('/api/resume/work-experience/'),
          fetch('/api/resume/projects/'),
          fetch('/api/resume/education/'),
          fetch('/api/resume/skills/')
        ]);

        const workData = await workRes.json();
        const projectsData = await projectsRes.json();
        const educationData = await educationRes.json();
        const skillsData = await skillsRes.json();

        setWorkExperience(workData);
        setProjects(projectsData);
        setEducation(educationData);
        setSkills(skillsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching resume data:', error);
        setLoading(false);
      }
    };

    fetchResumeData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: 'black', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#9b3dff'
      }}>
        <Typography variant="h4">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box className="about"
      sx={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: 'black',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: { xs: 2, md: 4 },
        pb: 10,
        pt: 10,
      }}
    >
      <FadeAppBar position="top" />
      <FadeAppBar position="bottom" />

      {/* Star-like particles in background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {[...Array(50)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              backgroundColor: i % 5 === 0 ? '#9b3dff' : '#2cfc03',
              borderRadius: '50%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `twinkle ${Math.random() * 5 + 3}s infinite ease-in-out`,
              opacity: Math.random() * 0.5 + 0.5,
              boxShadow: i % 5 === 0 ? '0 0 10px #9b3dff' : '0 0 5px #2cfc03',
            }}
          />
        ))}
      </Box>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(155, 61, 255, 0.3)',
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              color: '#9b3dff',
              fontWeight: 'bold',
              mb: 1,
            }}
          >
            Resume
          </Typography>

          <Divider sx={{ bgcolor: 'rgba(155, 61, 255, 0.3)', my: 4 }} />

          {/* Work Experience Section */}
          {workExperience.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ color: '#9b3dff', mb: 3, fontWeight: 'bold' }}>
                Work Experience
              </Typography>
              {workExperience.map((work) => (
                <Box
                  key={work.id}
                  sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid rgba(155, 61, 255, 0.3)',
                    backgroundColor: 'rgba(155, 61, 255, 0.05)'
                  }}
                >
                  <Typography variant="h5" sx={{ color: '#2cfc03', fontWeight: 'bold' }}>
                    {work.title}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#fff', mt: 1 }}>
                    {work.company}
                  </Typography>
                  {work.subtitle && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                      {work.subtitle}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                    {work.start_date} - {work.end_date}
                  </Typography>
                  {work.links && (
                    <Typography variant="body2" sx={{ color: '#9b3dff', mt: 1 }}>
                      {work.links}
                    </Typography>
                  )}
                  <Box sx={{ mt: 2, color: '#fff', '& p': { lineHeight: 1.8 } }}>
                    <ReactMarkdown>{work.description}</ReactMarkdown>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ color: '#9b3dff', mb: 3, fontWeight: 'bold' }}>
                Projects
              </Typography>
              {projects.map((project) => (
                <Box
                  key={project.id}
                  sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid rgba(155, 61, 255, 0.3)',
                    backgroundColor: 'rgba(155, 61, 255, 0.05)'
                  }}
                >
                  <Link href={project.url} target="_blank" rel="noopener" sx={{ textDecoration: 'none' }}>
                    <Typography variant="h5" sx={{ color: '#2cfc03', fontWeight: 'bold', '&:hover': { color: '#9b3dff' } }}>
                      {project.name}
                    </Typography>
                  </Link>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                    <strong>Tech Stack:</strong> {project.tech_stack}
                  </Typography>
                  <Box sx={{ mt: 2, color: '#fff', '& p': { lineHeight: 1.8 } }}>
                    <ReactMarkdown>{project.description}</ReactMarkdown>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ color: '#9b3dff', mb: 3, fontWeight: 'bold' }}>
                Education
              </Typography>
              {education.map((edu) => (
                <Box
                  key={edu.id}
                  sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid rgba(155, 61, 255, 0.3)',
                    backgroundColor: 'rgba(155, 61, 255, 0.05)'
                  }}
                >
                  <Typography variant="h5" sx={{ color: '#2cfc03', fontWeight: 'bold' }}>
                    {edu.school}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#fff', mt: 1 }}>
                    {edu.degree}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                    Graduation: {edu.graduation_date}
                    {edu.gpa && ` | GPA: ${edu.gpa}`}
                  </Typography>
                  {edu.additional_info && (
                    <Box sx={{ mt: 2, color: '#fff', '& p': { lineHeight: 1.8 } }}>
                      <ReactMarkdown>{edu.additional_info}</ReactMarkdown>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Skills Section */}
          {skills.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h4" sx={{ color: '#9b3dff', mb: 3, fontWeight: 'bold' }}>
                Skills
              </Typography>
              {skills.map((skillCategory) => (
                <Box
                  key={skillCategory.id}
                  sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid rgba(155, 61, 255, 0.3)',
                    backgroundColor: 'rgba(155, 61, 255, 0.05)'
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#2cfc03', fontWeight: 'bold', mb: 2 }}>
                    {skillCategory.category}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {skillCategory.items.split(',').map((item, index) => (
                      <Chip
                        key={index}
                        label={item.trim()}
                        sx={{
                          backgroundColor: 'rgba(155, 61, 255, 0.2)',
                          color: '#fff',
                          border: '1px solid rgba(155, 61, 255, 0.5)',
                          '&:hover': {
                            backgroundColor: 'rgba(155, 61, 255, 0.3)',
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Container>

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

export default ResumePage;
