import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { gruvboxLight, nord, hopscotch, lucario, shadesOfPurple, solarizedDarkAtom, synthwave84 } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
<style>
@import url('https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap');
</style>

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
        style={gruvboxLight}
        language={match[1]}
        PreTag="div"
        customStyle={{
          borderRadius: '8px',
          fontFamily: 'monospace',
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
          background: '#f7e6c8',
          color: '#b09971',
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
    <Container disableGutters
      sx={{
        '& pre': {
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'normal',
        },
        paddingTop: '70px',
        paddingBottom: '40px',
        width: '90%',
        margin: '0 auto',
      }}
    >
      <ReactMarkdown 
        sx={{
          '& pre': {
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
          },
          paddingTop: '125px',
          width: '80%',
          margin: '0 auto',
        }}
        components={{
          code: CodeBlock,
          p: ({node, ...props}) => (
            <p
              style={{
                color: '#fbf1c7',
              }}
              {...props}
            />
          ),
          h1: ({node, ...props}) => (
            <h1
              style={{
                textAlign: 'center',
                border: 'none',
                color: '#fbf1c7',
              }}
              {...props}
            />
          ),
          h2: ({node, ...props}) => (
            <h2
              style={{
                border: 'none',
                color: '#f5d59f',
                textAlign: 'center',
              }}
              {...props}
            />
          ),
          h3: ({node, ...props}) => (
            <h3
              style={{
                color: '#f5d59f',
                borderBottom: '2px solid #304529',
              }}
              {...props}
            />
          ),
          h4: ({node, ...props}) => (
            <h4
              style={{
                textAlign: 'center',
                color: '#f5d59f',
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
                borderTop: '1px solid #fbf1c7', // Adjust color as needed
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
