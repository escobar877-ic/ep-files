import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Slider, Typography } from '@mui/material';
import { Crop, RestartAlt, ZoomIn } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Cropper from 'react-easy-crop';

const OUTPUT_SIZE = 512;

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Не удалось прочитать изображение'));
    image.src = source;
  });
}

function sourceRectFromPercentages(image, cropArea) {
  const x = Math.max(0, Math.round((image.naturalWidth * cropArea.x) / 100));
  const y = Math.max(0, Math.round((image.naturalHeight * cropArea.y) / 100));
  const width = Math.min(image.naturalWidth - x, Math.max(1, Math.round((image.naturalWidth * cropArea.width) / 100)));
  const height = Math.min(image.naturalHeight - y, Math.max(1, Math.round((image.naturalHeight * cropArea.height) / 100)));
  return { x, y, width, height };
}

async function createCroppedAvatar(source, cropArea) {
  if (!cropArea) throw new Error('Выберите область изображения');

  const image = await loadImage(source);
  const sourceRect = sourceRectFromPercentages(image, cropArea);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Кадрирование не поддерживается браузером');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.beginPath();
  context.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(
    image,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
  if (!blob) throw new Error('Не удалось подготовить аватар');
  return new File([blob], 'avatar.webp', { type: 'image/webp', lastModified: Date.now() });
}

export default function AvatarCropDialog({ open, source, uploading, onClose, onConfirm }) {
  const theme = useTheme();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropArea(null);
    setError('');
  }, [open, source]);

  const handleSave = async () => {
    try {
      setPreparing(true);
      setError('');
      const file = await createCroppedAvatar(source, cropArea);
      await onConfirm(file);
    } catch (err) {
      setError(err.message || 'Не удалось подготовить аватар');
    } finally {
      setPreparing(false);
    }
  };

  const busy = preparing || uploading;

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="avatar-crop-title"
      slotProps={{ paper: { sx: { animation: 'none' } } }}
    >
      <DialogTitle id="avatar-crop-title" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Crop color="primary" />
        Обрезать аватар
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            position: 'relative',
            height: { xs: 320, sm: 420 },
            overflow: 'hidden',
            bgcolor: (currentTheme) => currentTheme.ep.inset,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {source && (
            <Cropper
              image={source}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              roundCropAreaPixels
              showGrid={false}
              objectFit="contain"
              onCropChange={setCrop}
              onCropAreaChange={(area) => setCropArea(area)}
              onZoomChange={setZoom}
              mediaProps={{ alt: 'Предпросмотр кадрирования аватара' }}
              style={{
                containerStyle: { backgroundColor: theme.ep.inset },
                cropAreaStyle: {
                  border: `2px solid ${theme.ep.warm}`,
                  boxShadow: `0 0 0 9999px ${theme.palette.mode === 'dark' ? 'rgba(8, 9, 14, 0.72)' : 'rgba(0, 0, 20, 0.58)'}`,
                },
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', gap: 1.5, mt: 2.5 }}>
          <ZoomIn color="primary" />
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.01}
            onChange={(_, value) => setZoom(value)}
            aria-label="Масштаб аватара"
            disabled={busy}
          />
          <Button startIcon={<RestartAlt />} onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); }} disabled={busy}>
            Сбросить
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Перемещайте изображение и настройте масштаб. Сохранится область внутри круга.
        </Typography>
        {error && <Typography role="alert" color="error" sx={{ mt: 2, fontSize: '0.78rem' }}>{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={busy}>Отмена</Button>
        <Button variant="contained" onClick={handleSave} disabled={busy || !cropArea} startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <Crop />}>
          {uploading ? 'Загрузка...' : preparing ? 'Подготовка...' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
