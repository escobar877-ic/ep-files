import { Link } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  ArrowForward,
  CloudUpload,
  FolderOpen,
  InsertDriveFile,
  RestoreFromTrash,
  Star,
  Storage,
} from '@mui/icons-material';
import FilesPageUploader from '../upload/FilesPageUploader';
import FileTypeIcon from '../FileTypeIcon';

function formatFileCount(count) {
  const value = Number(count) || 0;
  const mod100 = value % 100;
  const mod10 = value % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${value} файлов`;
  if (mod10 === 1) return `${value} файл`;
  if (mod10 >= 2 && mod10 <= 4) return `${value} файла`;
  return `${value} файлов`;
}

function WorkspaceShortcut({ to, icon, label, detail, isLast = false }) {
  return (
    <Button
      component={Link}
      to={to}
      endIcon={<ArrowForward />}
      sx={{
        minHeight: 74,
        px: { xs: 2, md: 2.5 },
        justifyContent: 'space-between',
        color: 'text.primary',
        borderRight: { xs: 0, sm: isLast ? 0 : '1px solid' },
        borderBottom: { xs: isLast ? 0 : '1px solid', sm: 0 },
        borderColor: 'divider',
        '&:hover': { bgcolor: (theme) => theme.ep.hover },
        '& .MuiButton-endIcon': { ml: 1 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, textAlign: 'left' }}>
        {icon}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>{label}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.66rem', textTransform: 'none' }}>{detail}</Typography>
        </Box>
      </Box>
    </Button>
  );
}

function RecentFiles({ files, loading, formatFileSize, formatDate, onOpen, onUploadClick }) {
  return (
    <Box component="section" sx={{ minWidth: 0, borderRight: { lg: '1px solid' }, borderColor: 'divider' }}>
      <Box sx={{ minHeight: 66, px: { xs: 2, md: 3 }, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.primary' }}>НЕДАВНИЕ ФАЙЛЫ</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>Последние добавленные и изменённые объекты</Typography>
        </Box>
        <Button component={Link} to="/file-manager" endIcon={<ArrowForward />} sx={{ flexShrink: 0 }}>
          Все файлы
        </Button>
      </Box>

      {loading && <LinearProgress />}

      {!loading && files.length === 0 && (
        <Box sx={{ minHeight: { xs: 300, lg: 470 }, p: 3, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <Box>
            <InsertDriveFile sx={{ color: 'primary.main', fontSize: 48, mb: 2 }} />
            <Typography className="ep-display" sx={{ color: 'text.primary', fontSize: { xs: '2.5rem', md: '3.4rem' }, lineHeight: 0.9 }}>
              ФАЙЛОВ ПОКА НЕТ
            </Typography>
            <Button variant="contained" startIcon={<CloudUpload />} onClick={onUploadClick} sx={{ mt: 3 }}>
              Загрузить первый файл
            </Button>
          </Box>
        </Box>
      )}

      {!loading && files.length > 0 && (
        <List disablePadding>
          {files.map((file, index) => (
            <ListItemButton
              key={file.id}
              onClick={onOpen}
              sx={{
                minHeight: 80,
                px: { xs: 2, md: 3 },
                borderBottom: index === files.length - 1 ? 0 : '1px solid',
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { bgcolor: (theme) => theme.ep.hover },
              }}
            >
              <Typography variant="overline" sx={{ width: 34, flexShrink: 0, color: 'text.secondary' }}>
                {String(index + 1).padStart(2, '0')}
              </Typography>
              <ListItemIcon sx={{ minWidth: 50 }}><FileTypeIcon file={{ ...file, type: 'file' }} size={34} /></ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={`${formatFileSize(file.size)} / ${formatDate(file.updated_at || file.created_at || file.date)}`}
                primaryTypographyProps={{ noWrap: true, fontWeight: 700, color: 'text.primary' }}
                secondaryTypographyProps={{ noWrap: true, color: 'text.secondary', fontSize: '0.68rem' }}
                sx={{ minWidth: 0 }}
              />
              <ArrowForward sx={{ ml: 1, flexShrink: 0 }} />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}

function StorageOverview({ stats, formatFileSize }) {
  const usagePercent = Math.min(100, Math.max(0, Number(stats?.usage_percent) || 0));
  return (
    <Box component="section" sx={{ p: { xs: 2.5, md: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.primary' }}>ХРАНИЛИЩЕ</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>Текущее использование пространства</Typography>
        </Box>
        <Storage sx={{ color: 'primary.main' }} />
      </Box>
      <Typography className="ep-display" sx={{ color: 'text.primary', fontSize: { xs: '4rem', md: '5rem' }, lineHeight: 0.85, mt: 3 }}>
        {usagePercent}%
      </Typography>
      <LinearProgress
        variant="determinate"
        value={usagePercent}
        sx={{ mt: 2, mb: 2.5, height: 8, bgcolor: (theme) => theme.ep.subtle, '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ pt: 2, pr: 2, borderRight: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>ИСПОЛЬЗОВАНО</Typography>
          <Typography sx={{ color: 'text.primary', fontWeight: 700 }}>{stats ? formatFileSize(stats.total_size) : '...'}</Typography>
        </Box>
        <Box sx={{ pt: 2, pl: 2 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>ДОСТУПНО</Typography>
          <Typography sx={{ color: 'text.primary', fontWeight: 700 }}>{stats ? formatFileSize(stats.available_space) : '...'}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

function QuickUpload({ onFileDropped, isUploading, uploadProgress }) {
  return (
    <Box component="section" sx={{ p: { xs: 2.5, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="overline" sx={{ color: 'text.primary' }}>БЫСТРАЯ ЗАГРУЗКА</Typography>
        <Typography variant="overline" sx={{ color: isUploading ? 'text.primary' : 'text.secondary' }}>
          {isUploading ? `${uploadProgress}%` : 'READY'}
        </Typography>
      </Box>
      <FilesPageUploader
        compact
        onFileDropped={onFileDropped}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />
    </Box>
  );
}

export default function AuthenticatedWorkspace({
  user,
  stats,
  files,
  loading,
  uploadError,
  onClearError,
  onFileDropped,
  isUploading,
  uploadProgress,
  onUploadClick,
  onOpenFiles,
  formatFileSize,
  formatDate,
}) {
  const displayName = user?.name?.trim() || user?.email || 'Пользователь';
  const totalFiles = stats?.total_files ?? 0;

  return (
    <Box component="main" sx={{ minHeight: 'calc(100vh - 86px)', bgcolor: 'background.default', color: 'text.primary', transition: 'background-color 180ms ease, color 180ms ease' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2.5, md: 4 } }}>
        <Box
          component="section"
          sx={{
            pb: { xs: 2.5, md: 3.5 },
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: 'text.primary' }}>{displayName} / PERSONAL WORKSPACE</Typography>
            <Typography component="h1" className="ep-display" sx={{ color: 'text.primary', fontSize: { xs: '2.8rem', sm: '4rem' }, lineHeight: 0.88, mt: 1 }}>
              МОЁ ХРАНИЛИЩЕ
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem', mt: 1.5 }}>
              {formatFileCount(totalFiles)} / {stats ? formatFileSize(stats.available_space) : '...'} свободно
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
            <Button variant="contained" startIcon={<CloudUpload />} onClick={onUploadClick} disabled={isUploading} sx={{ flexGrow: { xs: 1, sm: 0 } }}>
              Загрузить
            </Button>
            <Button component={Link} to="/file-manager" variant="outlined" startIcon={<FolderOpen />} sx={{ flexGrow: { xs: 1, sm: 0 } }}>
              Открыть файлы
            </Button>
          </Box>
        </Box>

        <Box component="nav" aria-label="Разделы личного кабинета" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', mb: 3 }}>
          <WorkspaceShortcut to="/file-manager" icon={<FolderOpen />} label="Все файлы" detail="Папки, поиск и доступ" />
          <WorkspaceShortcut to="/files" icon={<Star />} label="Избранное" detail="Профиль и важные файлы" />
          <WorkspaceShortcut to="/trash" icon={<RestoreFromTrash />} label="Корзина" detail="Удалённые объекты" isLast />
        </Box>

        {uploadError && <Alert severity="error" onClose={onClearError} sx={{ mb: 3 }}>{uploadError}</Alert>}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.55fr) minmax(320px, 0.75fr)' },
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <RecentFiles
            files={files}
            loading={loading}
            formatFileSize={formatFileSize}
            formatDate={formatDate}
            onOpen={onOpenFiles}
            onUploadClick={onUploadClick}
          />
          <Box component="aside" sx={{ minWidth: 0, borderTop: { xs: '1px solid', lg: 0 }, borderColor: 'divider' }}>
            <StorageOverview stats={stats} formatFileSize={formatFileSize} />
            <QuickUpload onFileDropped={onFileDropped} isUploading={isUploading} uploadProgress={uploadProgress} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
