import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function BrandWordmark({ inverse = false, sx = {} }) {
  const color = inverse ? '#f8f7f2' : '#0000f2';
  return (
    <Box
      component={Link}
      to="/"
      aria-label="EP Files — главная"
      sx={{
        color,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        lineHeight: 0.78,
        flexShrink: 0,
        ...sx,
      }}
    >
      <Typography
        component="span"
        className="ep-display"
        sx={{ color: 'inherit', fontSize: '1.55rem', lineHeight: 0.78 }}
      >
        EP
      </Typography>
      <Typography
        component="span"
        className="ep-display"
        sx={{ color: 'inherit', fontSize: '0.98rem', lineHeight: 0.9 }}
      >
        FILES
      </Typography>
    </Box>
  );
}
