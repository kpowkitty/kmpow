import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
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
    // Fixed the fetch path by adding quotes
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
    <BlogAccessories />
      <Container className="blog-container"
        disableGutters
        maxWidth={false}
        sx={{
          '& pre': {
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
          },
          margin: '0 auto',
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
                  borderTop: '1px solid #2DE600', // Adjust color as needed
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
