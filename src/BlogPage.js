import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import './BlogPage.css';
import BlogAccessories from './BlogAccessories.js';

// Define custom style for variables
const customStyle = {
  ...oneDark,
  'variable': {
    color: '#EBEA00', // Custom color for variables (e.g., bash variable)
  },
  'operator': {
    color: '#EBEA00', // Custom color for keywords
  },
  'string': {
    color: '#FF7700',
  },
  'comment': {
    color: '#EDE6ED',
  }
  // Add more customizations here if necessary
};

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return !inline && match ? (
    <div style={{ position: 'relative' }}>
      <SyntaxHighlighter
        style={customStyle}
        language={match[1]}
        PreTag="div"
        customStyle={{
          fontFamily: 'monospace',
          color: '#FF00EE',
          backgroundColor: '#1b1c1f',
        }}
        codeTagProps={{
          style: {
            fontSize: '15px',
            fontFamily: 'monospace',
          }
        }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: '#333842',
          color: '#FFFFFF',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  ) : (
    <code
      className={className}
      style={{
          fontFamily: 'monospace',
      }}
      {...props}
    >
      {children}
    </code>
  );
};

export default function BlogPage() {
  const { slug } = useParams();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetch(`/api/blogs/${slug}/`)
      .then((res) => {
        if (!res.ok) throw new Error('Blog not found');
        return res.json();
      })
      .then((data) => {
        setTitle(data.title);
        setContent(data.content);
      })
      .catch(() => {
        setTitle('Error');
        setContent('Error loading blog.');
      });
  }, [slug]);

  return (
    <Box
      className="blog-content"
      sx={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: 'transparent',
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
      <BlogAccessories />
      
      {/* Main Content */}
      <Container 
        maxWidth="md" 
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          margin: '0 auto',
          marginTop: '12vh',
        }}
      >
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
          <Container 
            className="blog-container"
            disableGutters
            maxWidth={false}
            sx={{
              '& pre': {
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'normal',
              },
            }}
          >
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              remarkPlugins={[remarkGfm]}
              sx={{
                '& pre': {
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'normal',
                },
              }}
              components={{
                code: CodeBlock,
                p: ({node, ...props}) => (
                  <p
                    style={{
                      color: '#2DE600',
                    }}
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    style={{
                      color: '#2DE600',
                      paddingLeft: '1.2em',
                      marginBottom: '0.5em',
                    }}
                    {...props}
                  />
                ),

                li: ({ node, ...props }) => (
                  <li
                    style={{
                      color: '#2DE600',
                      marginBottom: '0.5em',
                    }}
                    {...props}
                  />
                ),

                h1: ({node, ...props}) => (
                  <h1
                    style={{
                      textAlign: 'center',
                      border: 'none',
                      color: '#2DE600',
                    }}
                    {...props}
                  />
                ),
                h2: ({node, ...props}) => (
                  <h2
                    style={{
                      border: 'none',
                      color: '#2DE600',
                      textAlign: 'center',
                    }}
                    {...props}
                  />
                ),
                h3: ({node, ...props}) => (
                  <h3
                    style={{
                      color: '#2DE600',
                      borderBottom: '2px solid #2DE600',
                    }}
                    {...props}
                  />
                ),
                h4: ({node, ...props}) => (
                  <h4
                    style={{
                      textAlign: 'center',
                      color: '#2DE600',
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
                      borderTop: '1px solid #2DE600',
                    }}
                    {...props}
                  />
                )
              }}
            >
              {content}
            </ReactMarkdown>
          </Container>
        </Paper>
      </Container>
    </Box>
  );
}
