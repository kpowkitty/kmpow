import { useState } from 'react';
import { Card, CardActionArea, CardActions, Button, CardMedia, CardContent, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import ShareIcon from '@mui/icons-material/Share';

export default function ActionAreaCard({ title, desc, image, blogLink }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleShareClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    // Get the current URL for the blog post
    const url = `${window.location.origin}/content/${blogLink}`;

    // Copy the URL to clipboard
    navigator.clipboard.writeText(url)
  };

  return (
    <Card 
      sx={{
        maxWidth: 345,
        height: 315,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.8)', // Stronger shadow for contrast
        //border: '1px solid #fbf1c7',
        borderRadius: '12px',
        '&:hover': {
          transform: 'scale(1.03)', // Slight zoom for engagement
          transition: 'all 0.3s ease-in-out',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.8)',
          filter: 'brightness(1.1)',
         },
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        marginTop: '130px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/content/${blogLink}`} style={{ textDecoration: 'none' }}>
        <CardMedia
          component="img"
          height="140"
          image={image}
          alt={title}
        />
        <CardContent>
          <Typography 
            gutterBottom 
            variant="h5" 
            component="div"
            sx={{ 
              fontFamily: '"Source Sans 3", sans-serif',
              marginTop: 1,
              //display: '-webkit-box',
              //WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              //WebkitLineClamp: 2,
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              borderBottom: '1px solid #111111',
            }}
          >
            {title} 
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: '"Source Sans 3", sans-serif',
              color: '#111111',
            }}
          >
            {desc}
          </Typography>
        </CardContent>
          <CardActions>
            <Button size="small"
              sx={{
                position: 'absolute',
                bottom: 10,  // Position at the bottom-left corner
                left: 10,
                zIndex: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.0)',
                color: '#0e140c',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.0)',
                  color: '#fbf1c7',
                },
              }}
              onClick={handleShareClick}
            >
              Copy Link
          </Button>
        </CardActions>
      </Link>
    </Card>
  );
}
