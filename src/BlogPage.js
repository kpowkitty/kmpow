import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

export default function BlogPage() {
  const { slug } = useParams();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetch(`/content/${slug}.md`)
      .then((response) => {
        if (!response.ok) throw new Error('Content not found');
        return response.text();
      })
      .then((text) => {
        // Extract title from the first line of the markdown
        const lines = text.split('\n');
        const titleMatch = lines[0].match(/^#\s*(.+)/);
        setTitle(titleMatch ? titleMatch[1] : slug);
        setContent(text);
      })
      .catch(() => {
        setTitle('Error');
        setContent('Error loading content.');
      });
  }, [slug]);

  return (
    <div className="blog-content">
    <Container maxWidth="sm" disableGutters
      sx={{
        '& pre': {
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'normal',
        },
        paddingTop: '125px',
      }}
    >
      <ReactMarkdown  
        components={{
          p: ({node, ...props}) => (
            <p
              style={{
                color: '#000000',
              }}
              {...props}
            />
          ),
          h2: ({node, ...props}) => (
            <h2
              style={{
                border: 'none',
                color: '#000000',
              }}
              {...props}
            />
          ),
          h3: ({node, ...props}) => (
            <h3
              style={{
                color: '#000000',
                borderBottom: '2px solid #304529',
              }}
              {...props}
            />
          ),
          hr: ({node, ...props}) => (
            <hr 
              style={{
                width: 'calc(100% + 32px)',
                marginLeft: '-16px',
                marginRight: '-16px',
                border: 'none',
                borderTop: '1px solid #e0e0e0', // Adjust color as needed
              }} 
              {...props} 
            />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </Container>
    </div>
  );
}
