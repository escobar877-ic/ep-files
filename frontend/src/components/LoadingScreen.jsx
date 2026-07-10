import { Box, CircularProgress, Typography } from '@mui/material';
import { Folder } from '@mui/icons-material';

export default function LoadingScreen({ label = 'Загрузка' }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0000f2',
      }}
    >
      <Box
        className="ep-scale-in"
        sx={{
          width: 128,
          height: 128,
          border: '1px solid',
          borderColor: 'rgba(248,247,242,0.55)',
          backgroundColor: '#0000f2',
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          animation: 'epFloat 3.2s ease-in-out infinite',
        }}
      >
        <CircularProgress
          size={86}
          thickness={2.4}
          sx={{ color: '#f8f7f2', position: 'absolute' }}
        />
        <Folder sx={{ fontSize: 42, color: '#edff45', animation: 'epSoftPulse 2.4s ease-in-out infinite' }} />
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: -30,
            color: '#f8f7f2',
            fontWeight: 700,
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
}
