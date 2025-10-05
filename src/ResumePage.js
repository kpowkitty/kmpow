import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Container, Divider, Chip, Link } from '@mui/material';
import { Masonry } from '@mui/lab';
import { useLocation } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import pluralize from 'pluralize';
import LoadingStars from './LoadingStars';

const ROOT = process.env.ROOT || '';

const pluralExceptions = {
  'API': 'APIs',
  'System Administration': 'System Administration',
  'Virtualization': 'Virtualization',
  'Backend': 'Backend',
  'Frontend': 'Frontend',
  'Documentation': 'Documentation',
};

const displayCategory = (category, count) => {
  if (count == 1) {
    return category;
  }

  return pluralExceptions[category] || pluralize(category);
}

/**
 * Generic fetch helper
 */
const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
};

/**
 * Generic Section component for Resume items
 */
const Section = ({ title, children }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h4" sx={{ color: '#9b3dff', mb: 2, fontWeight: 'bold' }}>
      {title}
    </Typography>
    <Divider sx={{ bgcolor: 'rgba(155, 61, 255, 0.3)', mb: 3 }} />
    {children}
  </Box>
);

/**
 * Card wrapper for items
 */
const Card = ({ children }) => (
  <Box sx={{
    mb: 3,
    p: 3,
    borderRadius: 2,
    border: '1px solid rgba(155, 61, 255, 0.3)',
    backgroundColor: 'rgba(155, 61, 255, 0.05)'
  }}>
    {children}
  </Box>
);

/**
 * WorkExperienceItem
 */
const WorkExperienceItem = ({ work }) => (
  <Card>
    <Typography variant="h5" sx={{ color: '#2cfc03', fontWeight: 'bold' }}>{work.title}</Typography>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
      <Typography variant="h6" sx={{ color: '#fff' }}>{work.company}</Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
        {work.start_date} - {work.end_date}
      </Typography>
    </Box>

    {work.subtitle && (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, alignItems: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{work.subtitle}</Typography>
        {work.links && (
          <ReactMarkdown
            components={{
              p: ({ children }) => <span>{children}</span>,
              a: ({ href, children }) => <Link href={href} target="_blank" rel="noopener" sx={{ color: '#9b3dff', ml: 1 }}>{children}</Link>
            }}
          >
            {work.links}
          </ReactMarkdown>
        )}
      </Box>
    )}

    {work.tech_tags && work.tech_tags.length > 0 && (
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
        <strong>Tech Stack:</strong> {work.tech_tags.map(tag => tag.name).join(', ')}
      </Typography>
    )}

    <Box sx={{ mt: 2, color: '#fff', '& p': { lineHeight: 1.8 } }}>
      <ReactMarkdown>{work.description}</ReactMarkdown>
    </Box>
  </Card>
);


/**
 * ProjectItem
 */
const ProjectItem = ({ project }) => (
  <Card>
    <Link href={project.url} target="_blank" rel="noopener" sx={{ textDecoration: 'none' }}>
      <Typography variant="h5" sx={{ color: '#2cfc03', fontWeight: 'bold', '&:hover': { color: '#9b3dff' } }}>
        {project.name}
      </Typography>
    </Link>
    {project.tech_tags && project.tech_tags.length > 0 && (
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
        <strong>Tech Stack:</strong> {project.tech_tags.map(tag => tag.name).join(', ')}
      </Typography>
    )}
    <Box sx={{ mt: 2, color: '#fff', '& p': { lineHeight: 1.8 } }}>
      <ReactMarkdown>{project.description}</ReactMarkdown>
    </Box>
  </Card>
);

/**
 * EducationItem
 */
const EducationItem = ({ edu }) => (
  <Card>
    <Typography variant="h5" sx={{ color: '#2cfc03', fontWeight: 'bold' }}>{edu.school}</Typography>
    <Typography variant="h6" sx={{ color: '#fff', mt: 1 }}>{edu.degree}</Typography>
    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
      Graduation: {edu.graduation_date}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
    </Typography>
    {edu.additional_info && (
      <Box sx={{ mt: 2, color: '#fff', '& p': { lineHeight: 1.8 } }}>
        <ReactMarkdown>{edu.additional_info}</ReactMarkdown>
      </Box>
    )}
  </Card>
);

/**
 * SkillCategoryItem
 */
const SkillCategoryItem = ({ category }) => (
  <Paper sx={{
    p: 2,
    borderRadius: 2,
    border: '1px solid rgba(155, 61, 255, 0.3)',
    backgroundColor: 'rgba(155, 61, 255, 0.05)'
  }}>
    <Typography variant="h6" sx={{ color: '#2cfc03', fontWeight: 'bold', mb: 2 }}>
      {displayCategory(category.category, category.tags.length)}
    </Typography>

    <Masonry columns={{ xs: 1 }} spacing={1}>
      {category.tags.map((tag, i) => (
        <Chip
          key={i}
          label={tag}
          sx={{
            backgroundColor: 'rgba(155, 61, 255, 0.2)',
            color: '#fff',
            border: '1px solid rgba(155, 61, 255, 0.5)',
            '&:hover': { backgroundColor: 'rgba(155, 61, 255, 0.3)' },
            lineHeight: 1.2,           // optional: adjust spacing between lines
            px: 1.5,                   // horizontal padding
            py: 0.5,                   // vertical padding
            maxWidth: '100%',           // ensure it doesn’t overflow container
            height: 'auto',             // let height expand with text
            '& .MuiChip-label': {
              whiteSpace: 'normal',
              overflow: 'visible',
              textOverflow: 'unset',
              lineHeight: 1.2,
              textAlign: 'center',
            }
          }}
        />
      ))}
    </Masonry>
  </Paper>
);

const ResumePage = () => {
  const location = useLocation();
  const [workExperience, setWorkExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [education, setEducation] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [workData, projectData, eduData, techData] = await Promise.all([
          fetchJSON(`${ROOT}/api/resume/work-experience/`),
          fetchJSON(`${ROOT}/api/resume/projects/`),
          fetchJSON(`${ROOT}/api/resume/education/`),
          fetchJSON(`${ROOT}/api/tech-stack/`)
        ]);

        setWorkExperience(workData);
        setProjects(projectData);
        setEducation(eduData);

        // Map consolidated tech stack to UI-friendly format
        setSkills(techData.map(cat => ({ category: cat.category, tags: cat.tags })));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) return <LoadingStars message="Loading..." />;

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', backgroundColor: 'transparent', color: 'white', pb: 10, pt: 10 }}>

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, mt: '8vh' }}>
        <Paper sx={{ padding: 4, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(155, 61, 255, 0.3)', borderRadius: 2 }} elevation={6}>
          <Typography variant="h3" sx={{ textAlign: 'center', color: '#9b3dff', fontWeight: 'bold', mb: 1 }}>Resume</Typography>
          <Divider sx={{ bgcolor: 'rgba(155, 61, 255, 0.3)', my: 4 }} />

          <Section title="Work Experience">
            {workExperience.length ? workExperience.map(w => <WorkExperienceItem key={w.id} work={w} />)
              : <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No work experience added yet.</Typography>}
          </Section>

          <Section title="Projects">
            {projects.length ? projects.map(p => <ProjectItem key={p.id} project={p} />)
              : <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No projects added yet.</Typography>}
          </Section>

          <Section title="Education">
            {education.length ? education.map(e => <EducationItem key={e.id} edu={e} />)
              : <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No education added yet.</Typography>}
          </Section>


          <Section title="Skills and Passions">
            {skills.length ? (
              <Masonry
                columns={{ xs: 1, sm: 2, md: 3 }}
                spacing={2}
              >
                {skills.map((s, i) => (
                  <SkillCategoryItem key={i} category={s} />
                ))}
              </Masonry>
            ) : (
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                No skills added yet.
              </Typography>
            )}
          </Section>
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
