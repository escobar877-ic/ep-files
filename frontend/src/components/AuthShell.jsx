import { Box, Container, Paper, Typography } from '@mui/material';
import BrandWordmark from './BrandWordmark';

const authPanelSx = {
  width: '100%',
  maxWidth: 560,
  justifySelf: 'end',
  bgcolor: '#fffefa',
  color: '#0000f2',
  colorScheme: 'light',
  border: '1px solid #0000f2',
  p: { xs: 2.5, sm: 4, md: 5 },
  '& .MuiInputLabel-root': {
    color: '#4d4db0',
    opacity: 1,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#0000f2',
  },
  '& .MuiInputLabel-root.Mui-error': {
    color: '#b42318',
  },
  '& .MuiOutlinedInput-root': {
    color: '#0000c8',
    backgroundColor: '#fffefa',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0,0,242,0.42)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#0000f2',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#0000f2',
      borderWidth: 2,
    },
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: '#b42318',
    },
  },
  '& .MuiInputBase-input': {
    color: '#0000c8 !important',
    WebkitTextFillColor: '#0000c8 !important',
    caretColor: '#0000f2',
    opacity: 1,
    '&::placeholder': {
      color: '#6565aa',
      opacity: 1,
    },
    '&:-webkit-autofill': {
      WebkitTextFillColor: '#0000c8 !important',
      WebkitBoxShadow: '0 0 0 1000px #fffefa inset !important',
      caretColor: '#0000f2',
    },
    '&:-moz-autofill': {
      color: '#0000c8 !important',
      boxShadow: '0 0 0 1000px #fffefa inset !important',
    },
  },
  '& .MuiFormHelperText-root': {
    color: '#4d4db0',
  },
  '& .MuiFormHelperText-root.Mui-error': {
    color: '#b42318',
  },
  '& form > .MuiTypography-root': {
    color: '#4d4db0',
  },
  '& .MuiButton-contained': {
    backgroundColor: '#0000f2',
    color: '#f8f7f2',
    border: '1px solid #0000f2',
  },
  '& .MuiButton-contained:hover': {
    backgroundColor: '#0000b8',
  },
  '& .MuiButton-contained.Mui-disabled': {
    backgroundColor: 'rgba(0,0,242,0.14)',
    color: 'rgba(0,0,120,0.55)',
    borderColor: 'rgba(0,0,242,0.2)',
  },
};

export default function AuthShell({ eyebrow, title, subtitle, children }) {
  return (
    <Box className="ep-page" sx={{ minHeight: '100svh', bgcolor: '#0000f2', color: '#f8f7f2' }}>
      <Box sx={{ height: 86, display: 'grid', placeItems: 'center', borderBottom: '1px solid rgba(248,247,242,0.42)' }}>
        <BrandWordmark inverse />
      </Box>
      <Container maxWidth="xl" sx={{ minHeight: 'calc(100svh - 86px)', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.08fr 0.92fr' }, alignItems: 'center', gap: { xs: 3, md: 7 }, py: { xs: 4, md: 6 }, px: { xs: 2, sm: 4, md: 7 } }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" sx={{ color: '#f8f7f2' }}>{eyebrow}</Typography>
          <Typography className="ep-display" component="h1" sx={{ mt: 2, color: '#f8f7f2', fontSize: { xs: '3.6rem', sm: '5.4rem', md: '6.4rem' }, lineHeight: 0.82 }}>
            {title}
          </Typography>
          <Typography sx={{ color: 'rgba(248,247,242,0.72)', maxWidth: 540, mt: 3, fontSize: '0.82rem' }}>{subtitle}</Typography>
          <Box sx={{ display: { xs: 'none', md: 'block' }, height: 220, mt: 4, overflow: 'hidden', border: '1px solid rgba(248,247,242,0.45)' }}>
            <Box component="img" className="ep-hermes-art" src="/assets/hermes-hero-art.webp" alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 48%', transform: 'scale(1.45)' }} />
          </Box>
        </Box>
        <Paper className="ep-scale-in" sx={authPanelSx}>
          <Typography variant="overline" sx={{ color: '#0000f2', display: 'block', pb: 2, mb: 2, borderBottom: '1px solid #0000f2' }}>SECURE SESSION</Typography>
          {children}
        </Paper>
      </Container>
    </Box>
  );
}
