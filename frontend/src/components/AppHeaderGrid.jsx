import { Box } from '@mui/material';

export default function AppHeaderGrid({ children, sx = {} }) {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 86,
        maxWidth: 1340,
        mx: 'auto',
        px: { xs: 2, md: 5 },
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        boxSizing: 'border-box',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
