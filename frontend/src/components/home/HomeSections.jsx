import { Link } from 'react-router-dom';
import FilesPageUploader from '../upload/FilesPageUploader';
import HeaderProfileButton from '../HeaderProfileButton';
import BrandWordmark from '../BrandWordmark';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import {
  ArrowForward,
  CloudUpload,
  Folder,
  InsertDriveFile,
  Login as LoginIcon,
  PersonAdd,
  Share,
  Storage,
} from '@mui/icons-material';

const blue = '#0000f2';
const paper = '#f8f7f2';
const acid = '#edff45';

export function HomeHeader({ user }) {
  return (
    <Box
      component="header"
      sx={{
        minHeight: 86,
        backgroundColor: blue,
        color: paper,
        borderBottom: '1px solid rgba(248,247,242,0.42)',
        position: 'sticky',
        top: 0,
        zIndex: 1200,
      }}
    >
      <Box
        sx={{
          minHeight: 86,
          maxWidth: 1340,
          mx: 'auto',
          px: { xs: 2, md: 5 },
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Button
          component={Link}
          to={user ? '/file-manager' : '/login'}
          color="inherit"
          startIcon={user ? <Folder /> : <LoginIcon />}
          sx={{ justifySelf: 'start', px: 0, minWidth: 0, '& .MuiButton-startIcon': { display: { xs: 'none', sm: 'inherit' } } }}
        >
          {user ? 'Хранилище' : 'Войти'}
        </Button>
        <BrandWordmark inverse />
        <Box sx={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 1 }}>
          {!user ? (
            <Button component={Link} to="/register" color="inherit" endIcon={<ArrowForward />} sx={{ px: 0 }}>
              Создать аккаунт
            </Button>
          ) : (
            <HeaderProfileButton
              user={user}
              component={Link}
              to="/files"
              sx={{ color: paper, borderColor: 'rgba(248,247,242,0.55)', backgroundColor: 'transparent', minWidth: { xs: 44, sm: 170 } }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

function HeroArt() {
  return (
    <Box
      className="ep-atlas-frame"
      sx={{
        minHeight: { xs: 220, md: 650 },
        height: { xs: 220, md: '100%' },
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Box className="ep-art-ring" sx={{ width: { xs: 310, md: 540 }, height: { xs: 310, md: 540 }, top: '12%', left: '12%' }} />
      <Box className="ep-art-ring" sx={{ width: { xs: 245, md: 410 }, height: { xs: 245, md: 410 }, top: '21%', right: '1%' }} />
      <Box
        component="img"
        className="ep-atlas-image"
        src="/assets/farnese-atlas.jpg"
        alt="Атлас удерживает небесную сферу"
        sx={{
          display: 'block',
          width: '100%',
          height: '100%',
          minHeight: { xs: 220, md: 650 },
          objectFit: 'cover',
          objectPosition: '50% 42%',
          opacity: 0.92,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: { xs: 8, md: 18 },
          bottom: { xs: 8, md: 20 },
          color: paper,
          textAlign: 'right',
          fontSize: '0.66rem',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        PRIVATE STORAGE<br />CONTROLLED SHARING<br />100 MB INCLUDED
      </Box>
    </Box>
  );
}

export function HomeHero({ user }) {
  return (
    <Box sx={{ backgroundColor: blue, color: paper, minHeight: { xs: 'auto', md: 'calc(100svh - 150px)' } }}>
      <Box
        sx={{
          maxWidth: 1340,
          minHeight: { md: 'calc(100svh - 150px)' },
          mx: 'auto',
          px: { xs: 2.5, sm: 4, md: 7 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '0.93fr 1.07fr' },
          alignItems: 'center',
          gap: { xs: 1, md: 4 },
          overflow: 'hidden',
        }}
      >
        <Box sx={{ pt: { xs: 4, md: 5 }, pb: { xs: 2, md: 5 }, zIndex: 1 }}>
          <Typography variant="overline" sx={{ display: 'block', color: paper, mb: 2 }}>
            {user ? `ЛИЧНЫЙ АРХИВ • ${user.name || user.email}` : 'OPEN ACCESS • MIT LICENSE'}
          </Typography>
          <Typography
            component="h1"
            className="ep-display"
            sx={{
              color: paper,
              fontSize: { xs: '3.15rem', sm: '5.2rem', md: '5.6rem' },
              lineHeight: 0.84,
              maxWidth: 680,
            }}
          >
            {user ? (
              <>ВАШИ ФАЙЛЫ<br />ВСЕГДА<br />ПОД РУКОЙ</>
            ) : (
              <>ФАЙЛЫ,<br />КОТОРЫЕ<br />ВСЕГДА С ВАМИ</>
            )}
          </Typography>
          <Typography sx={{ mt: 3, mb: 3, maxWidth: 540, color: 'rgba(248,247,242,0.78)', fontSize: { xs: '0.82rem', md: '0.92rem' } }}>
            Загружайте, организуйте и передавайте документы через одно защищенное пространство. Контроль доступа остается у вас.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to={user ? '/file-manager' : '/register'}
              variant="contained"
              startIcon={user ? <Folder /> : <PersonAdd />}
              sx={{ bgcolor: paper, color: blue, '&:hover': { bgcolor: acid } }}
            >
              {user ? 'Открыть файлы' : 'Начать бесплатно'}
            </Button>
            <Button
              component={Link}
              to={user ? '/files' : '/login'}
              variant="outlined"
              sx={{ color: paper, borderColor: 'rgba(248,247,242,0.65)', '&:hover': { borderColor: paper, bgcolor: 'rgba(248,247,242,0.08)' } }}
            >
              {user ? 'Профиль' : 'Войти'}
            </Button>
          </Box>
        </Box>
        <HeroArt />
      </Box>
    </Box>
  );
}

function StorageStat({ number, label, detail, icon, children }) {
  return (
    <Box sx={{ minWidth: 0, minHeight: 238, p: { xs: 2.5, md: 3.5 }, borderRight: { md: `1px solid ${blue}` }, borderBottom: { xs: `1px solid ${blue}`, md: 0 }, '&:last-of-type': { borderRight: 0, borderBottom: 0 } }}>
        <Box sx={{ color: blue, mb: 3 }}>{icon}</Box>
        <Typography className="ep-display" sx={{ fontSize: { xs: '3.1rem', md: '4rem' }, lineHeight: 0.9, color: blue }}>{number}</Typography>
        <Typography variant="overline" sx={{ display: 'block', mt: 1, color: blue }}>{label}</Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#4d4db0' }}>{detail}</Typography>
        {children}
    </Box>
  );
}

export function StorageStatsPanel({ stats, formatFileSize, isUploading, onUploadClick }) {
  if (!stats) return null;
  return (
    <Box sx={{ border: `1px solid ${blue}`, mb: 5, backgroundColor: '#fffefa' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, p: 2, borderBottom: `1px solid ${blue}` }}>
        <Typography variant="overline" sx={{ color: blue }}>#01 STORAGE OVERVIEW</Typography>
        <Typography variant="overline" sx={{ color: blue }}>{stats.usage_percent || 0}% USED</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
        <StorageStat number={stats.total_files || 0} label="Всего файлов" detail={`${stats.recent_files_count || 0} добавлено за неделю`} icon={<InsertDriveFile />} />
        <StorageStat number={formatFileSize(stats.total_size)} label="Использовано" detail={`Лимит: ${formatFileSize(stats.storage_limit)}`} icon={<Storage />}>
          <LinearProgress variant="determinate" value={stats.usage_percent || 0} sx={{ mt: 2, height: 7, bgcolor: 'rgba(0,0,242,0.12)', '& .MuiLinearProgress-bar': { bgcolor: blue } }} />
        </StorageStat>
        <StorageStat number={formatFileSize(stats.available_space)} label="Доступно" detail="Место готово для новых материалов" icon={<CloudUpload />}>
          <Button onClick={onUploadClick} disabled={isUploading} variant="outlined" sx={{ mt: 2 }} startIcon={<CloudUpload />}>Загрузить</Button>
        </StorageStat>
      </Box>
    </Box>
  );
}

function ProductFeature({ index, title, body, visual }) {
  return (
    <Box sx={{ minWidth: 0, height: '100%', borderRight: { md: `1px solid ${blue}` }, borderBottom: { xs: `1px solid ${blue}`, md: 0 }, '&:last-of-type': { borderRight: 0, borderBottom: 0 } }}>
        <Box sx={{ p: 2.5, minHeight: 128 }}>
          <Typography variant="overline" sx={{ color: blue }}>#{index}</Typography>
          <Typography className="ep-display" sx={{ color: blue, fontSize: { xs: '2.25rem', md: '2.65rem' }, lineHeight: 0.92, mt: 1 }}>{title}</Typography>
        </Box>
        <Box sx={{ height: 260, borderTop: `1px solid ${blue}`, borderBottom: `1px solid ${blue}`, overflow: 'hidden', bgcolor: blue }}>{visual}</Box>
        <Typography sx={{ p: 2.5, minHeight: 132, color: blue, fontSize: '0.78rem', textTransform: 'uppercase' }}>{body}</Typography>
    </Box>
  );
}

export function GuestCta() {
  return (
    <Box sx={{ border: `1px solid ${blue}`, backgroundColor: '#fffefa' }}>
      <Box sx={{ p: { xs: 2.5, md: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, flexDirection: { xs: 'column', md: 'row' }, gap: 2, borderBottom: `1px solid ${blue}` }}>
        <Box>
          <Typography variant="overline" sx={{ color: blue }}>FEATURE PREVIEW</Typography>
          <Typography className="ep-display" sx={{ color: blue, fontSize: { xs: '3rem', md: '5rem' }, lineHeight: 0.88, mt: 1 }}>ОДНО МЕСТО<br />ДЛЯ ВСЕГО</Typography>
        </Box>
        <Button component={Link} to="/register" variant="contained" endIcon={<ArrowForward />}>Создать хранилище</Button>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
        <ProductFeature
          index="1 UPLOAD"
          title={<>ЗАГРУЖАЙТЕ<br />БЕЗ ЛИШНЕГО</>}
          body="Drag & drop, индикатор прогресса и серверная проверка типа файла в одном предсказуемом потоке."
          visual={<Box component="img" className="ep-feature-image" src="/assets/farnese-atlas.jpg" alt="Атлас" sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 25%', opacity: 0.9 }} />}
        />
        <ProductFeature
          index="2 ORGANIZE"
          title={<>СТРУКТУРА<br />БЕЗ ХАОСА</>}
          body="Папки, поиск, избранное и корзина помогают быстро найти нужный объект и восстановить удаленное."
          visual={(
            <Box sx={{ height: '100%', p: 2.5, color: paper, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
              {['/ Проекты', '/ Документы', '/ Изображения', '/ Архив'].map((item, index) => (
                <Box key={item} sx={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', border: '1px solid rgba(248,247,242,0.55)', minHeight: 46, px: 1.5 }}>
                  <Folder fontSize="small" /><Typography sx={{ fontSize: '0.76rem', color: paper }}>{item}</Typography><Typography sx={{ fontSize: '0.66rem', color: acid }}>0{index + 1}</Typography>
                </Box>
              ))}
            </Box>
          )}
        />
        <ProductFeature
          index="3 SHARE"
          title={<>ДЕЛИТЕСЬ<br />ТОЧНО</>}
          body="Публичные ссылки с ограничением срока и ACL-права на чтение или запись оставляют доступ под контролем."
          visual={(
            <Box sx={{ height: '100%', p: 3, color: paper, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Share sx={{ fontSize: 42 }} />
              <Box>
                <Typography variant="overline" sx={{ color: acid }}>PUBLIC LINK</Typography>
                <Typography className="ep-display" sx={{ color: paper, fontSize: '2rem', overflowWrap: 'anywhere' }}>ep.files/s/8f2a</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.68rem', color: 'rgba(248,247,242,0.7)' }}>READ ONLY • EXPIRES IN 24H</Typography>
            </Box>
          )}
        />
      </Box>
    </Box>
  );
}

export function QuickActionsPanel({ uploadError, onClearError, onFileDropped, isUploading, uploadProgress, onUploadClick }) {
  return (
    <Box sx={{ border: `1px solid ${blue}`, mb: 5, backgroundColor: '#fffefa' }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${blue}`, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="overline" sx={{ color: blue }}>#02 QUICK UPLOAD</Typography>
        <Typography variant="overline" sx={{ color: blue }}>{isUploading ? `${uploadProgress}%` : 'READY'}</Typography>
      </Box>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {uploadError && <Alert severity="error" sx={{ mb: 2 }} onClose={onClearError}>{uploadError}</Alert>}
        <FilesPageUploader onFileDropped={onFileDropped} isUploading={isUploading} uploadProgress={uploadProgress} />
        <Button variant="contained" onClick={onUploadClick} startIcon={<CloudUpload />} disabled={isUploading}>Выбрать файл</Button>
      </Box>
    </Box>
  );
}

export function RecentFilesPanel({ files, loading, formatFileSize, formatDate, onOpen }) {
  if (!loading && files.length === 0) return null;
  return (
    <Box sx={{ border: `1px solid ${blue}`, backgroundColor: '#fffefa' }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${blue}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="overline" sx={{ color: blue }}>#03 RECENT FILES</Typography>
        <Button component={Link} to="/file-manager" endIcon={<ArrowForward />}>Все файлы</Button>
      </Box>
      {loading ? <LinearProgress /> : (
        <List disablePadding>
          {files.map((file, index) => (
            <Box key={file.id}>
              <ListItem onClick={onOpen} sx={{ px: 2.5, py: 1.75, cursor: 'pointer', color: blue, '&:hover': { bgcolor: 'rgba(0,0,242,0.06)' } }}>
                <InsertDriveFile sx={{ mr: 2 }} />
                <ListItemText primary={file.name} secondary={`${formatFileSize(file.size)} • ${formatDate(file.updated_at || file.created_at || file.date)}`} primaryTypographyProps={{ noWrap: true, fontWeight: 700 }} />
                <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, color: '#4d4db0' }}>0{index + 1}</Typography>
              </ListItem>
              {index < files.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
}

export function HomeFooter() {
  return (
    <Box component="footer" sx={{ bgcolor: blue, color: paper, borderTop: '1px solid rgba(248,247,242,0.5)', py: { xs: 5, md: 7 }, mt: 7 }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr' }, alignItems: 'end', gap: 4 }}>
          <Box>
            <Typography variant="overline" sx={{ color: paper }}>EP FILES V2.0</Typography>
            <Typography sx={{ color: 'rgba(248,247,242,0.68)', fontSize: '0.72rem', mt: 1 }}>DJANGO • REACT • POSTGRESQL</Typography>
          </Box>
          <Typography className="ep-display" sx={{ fontSize: { xs: '4rem', md: '7rem' }, lineHeight: 0.7, color: paper, textAlign: 'center' }}>EP</Typography>
          <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="overline" sx={{ color: paper }}>MIT LICENSE • 2026</Typography>
            <Typography sx={{ color: 'rgba(248,247,242,0.68)', fontSize: '0.72rem', mt: 1 }}>SECURE FILE EXCHANGE</Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
