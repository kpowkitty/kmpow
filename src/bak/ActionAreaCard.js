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
    <Card class="card" 
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
          >
            {title} 
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
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
