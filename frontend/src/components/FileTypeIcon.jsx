import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getFileExtension, getFileType } from './fileTypeConfig';

export default function FileTypeIcon({ file, size = 40 }) {
  const definition = getFileType(file);
  const extension = getFileExtension(file);
  const Icon = definition.icon;
  const badge = definition.type === 'folder'
    ? definition.badge
    : (extension || definition.badge).toUpperCase().slice(0, 4);
  const labelSize = Math.max(6, Math.min(9, Math.round(size * 0.17)));

  return (
    <Box
      component="span"
      role="img"
      aria-label={`${definition.label}: ${file?.name || definition.label}`}
      data-file-type={definition.type}
      sx={{
        width: size,
        height: size,
        minWidth: size,
        display: 'inline-flex',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        border: '1px solid',
        borderColor: (theme) => theme.palette.mode === 'dark' ? alpha(definition.accent, 0.72) : alpha('#0000f2', 0.42),
        backgroundColor: (theme) => alpha(definition.accent, theme.palette.mode === 'dark' ? 0.13 : 0.22),
        color: (theme) => theme.palette.mode === 'dark' ? '#f8f7f2' : '#0000f2',
      }}
    >
      <Box
        component="span"
        aria-hidden="true"
        sx={{ position: 'absolute', inset: '0 0 auto', height: Math.max(3, Math.round(size * 0.09)), backgroundColor: definition.accent }}
      />
      <Icon aria-hidden="true" sx={{ fontSize: Math.round(size * 0.46), transform: `translateY(-${Math.max(1, Math.round(size * 0.05))}px)` }} />
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          position: 'absolute',
          right: Math.max(2, Math.round(size * 0.07)),
          bottom: Math.max(1, Math.round(size * 0.03)),
          maxWidth: `calc(100% - ${Math.max(4, Math.round(size * 0.12))}px)`,
          overflow: 'hidden',
          fontFamily: (theme) => theme.ep.monoFont,
          fontSize: labelSize,
          fontWeight: 700,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {badge}
      </Box>
    </Box>
  );
}
