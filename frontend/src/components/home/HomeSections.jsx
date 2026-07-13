import { Link } from 'react-router-dom';
import { Box, Button, Container, IconButton, Tooltip, Typography } from '@mui/material';
import {
  ArrowForward,
  DarkMode,
  Folder,
  LightMode,
  Login as LoginIcon,
  PersonAdd,
  Share,
} from '@mui/icons-material';
import HeaderProfileButton from '../HeaderProfileButton';
import BrandWordmark from '../BrandWordmark';
import { useThemeMode } from '../../themeMode';

const blue = '#0000f2';
const paper = '#f8f7f2';
const acid = '#edff45';

export function HomeHeader({ user }) {
  const { mode, toggleMode } = useThemeMode();
  const nextThemeLabel = mode === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';

  return (
    <Box
      component="header"
      sx={{
        minHeight: 86,
        backgroundColor: (theme) => user ? theme.ep.header : blue,
        color: paper,
        borderBottom: '1px solid',
        borderColor: (theme) => user ? theme.ep.headerLine : 'rgba(248,247,242,0.42)',
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
          sx={{
            justifySelf: 'start',
            px: 0,
            minWidth: 0,
            '& .MuiButton-startIcon': { display: { xs: 'none', sm: 'inherit' } },
          }}
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
            <>
              <Tooltip title={nextThemeLabel}>
                <IconButton
                  onClick={toggleMode}
                  aria-label={nextThemeLabel}
                  sx={{ width: 40, height: 40, color: paper, border: '1px solid rgba(248,247,242,0.55)' }}
                >
                  {mode === 'dark' ? <LightMode /> : <DarkMode />}
                </IconButton>
              </Tooltip>
              <HeaderProfileButton
                user={user}
                component={Link}
                to="/files"
                sx={{
                  color: paper,
                  borderColor: 'rgba(248,247,242,0.55)',
                  backgroundColor: 'transparent',
                  minWidth: { xs: 44, sm: 170 },
                  '&:hover': { backgroundColor: 'rgba(248,247,242,0.1)', borderColor: paper },
                }}
              />
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function HeroArt() {
  return (
    <Box
      className="ep-hermes-frame"
      sx={{
        minHeight: { xs: 245, sm: 320, md: 650 },
        height: { xs: 245, sm: 320, md: '100%' },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        component="img"
        className="ep-hermes-art"
        src="/assets/hermes-hero-art.webp"
        alt="Стилизованная графическая композиция"
        sx={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: { xs: 'cover', md: 'contain' },
          objectPosition: { xs: '50% 43%', md: '50% 50%' },
          transform: { xs: 'scale(1.08)', md: 'scale(1.12) translateY(2%)' },
        }}
      />
      <Typography
        variant="overline"
        sx={{
          position: 'absolute',
          right: { xs: 8, md: 18 },
          bottom: { xs: 8, md: 20 },
          color: paper,
          textAlign: 'right',
          fontSize: '0.62rem',
        }}
      >
        STORAGE / SYNC / SHARE
      </Typography>
    </Box>
  );
}

export function HomeHero() {
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
            PRIVATE STORAGE / CONTROLLED SHARING
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
            ФАЙЛЫ,<br />КОТОРЫЕ<br />ВСЕГДА С ВАМИ
          </Typography>
          <Typography sx={{ mt: 3, mb: 3, maxWidth: 540, color: 'rgba(248,247,242,0.78)', fontSize: { xs: '0.82rem', md: '0.92rem' } }}>
            Загружайте, организуйте и передавайте документы через одно защищенное пространство. Контроль доступа остается у вас.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              startIcon={<PersonAdd />}
              sx={{ bgcolor: paper, color: blue, '&:hover': { bgcolor: acid } }}
            >
              Начать бесплатно
            </Button>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              sx={{
                color: paper,
                borderColor: 'rgba(248,247,242,0.65)',
                '&:hover': { borderColor: paper, bgcolor: 'rgba(248,247,242,0.08)' },
              }}
            >
              Войти
            </Button>
          </Box>
        </Box>
        <HeroArt />
      </Box>
    </Box>
  );
}

function ProductFeature({ index, title, body, visual }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        height: '100%',
        borderRight: { md: `1px solid ${blue}` },
        borderBottom: { xs: `1px solid ${blue}`, md: 0 },
        '&:last-of-type': { borderRight: 0, borderBottom: 0 },
      }}
    >
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
          visual={<Box component="img" src="/assets/hermes-hero-art.webp" alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.45)' }} />}
        />
        <ProductFeature
          index="2 ORGANIZE"
          title={<>СТРУКТУРА<br />БЕЗ ХАОСА</>}
          body="Папки, поиск, избранное и корзина помогают быстро найти нужный объект и восстановить удаленное."
          visual={(
            <Box sx={{ height: '100%', p: 2.5, color: paper, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
              {['/ Проекты', '/ Документы', '/ Изображения', '/ Архив'].map((item, index) => (
                <Box key={item} sx={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', border: '1px solid rgba(248,247,242,0.55)', minHeight: 46, px: 1.5 }}>
                  <Folder fontSize="small" />
                  <Typography sx={{ fontSize: '0.76rem', color: paper }}>{item}</Typography>
                  <Typography sx={{ fontSize: '0.66rem', color: acid }}>0{index + 1}</Typography>
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
              <Typography sx={{ fontSize: '0.68rem', color: 'rgba(248,247,242,0.7)' }}>READ ONLY / EXPIRES IN 24H</Typography>
            </Box>
          )}
        />
      </Box>
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
            <Typography sx={{ color: 'rgba(248,247,242,0.68)', fontSize: '0.72rem', mt: 1 }}>SITES WORKER / REACT / D1 + R2</Typography>
          </Box>
          <Typography className="ep-display" sx={{ fontSize: { xs: '4rem', md: '7rem' }, lineHeight: 0.7, color: paper, textAlign: 'center' }}>EP</Typography>
          <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="overline" sx={{ color: paper }}>MIT LICENSE / 2026</Typography>
            <Typography sx={{ color: 'rgba(248,247,242,0.68)', fontSize: '0.72rem', mt: 1 }}>SECURE FILE EXCHANGE</Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
