import { useEffect, useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { alpha, createTheme } from '@mui/material/styles';
import { ThemeModeContext } from './themeMode';

const THEME_STORAGE_KEY = 'ep_theme_mode';
const HERMES_BLUE = '#0000f2';
const PAPER = '#f4f2ec';
const ACID = '#edff45';

function modeTokens(mode) {
  const dark = mode === 'dark';
  return {
    dark,
    blue: HERMES_BLUE,
    acid: ACID,
    onBlue: '#f8f7f2',
    primary: dark ? '#f8f7f2' : HERMES_BLUE,
    primaryLight: dark ? '#ffffff' : '#3939ff',
    primaryDark: dark ? '#d9d7cf' : '#0000b8',
    secondary: dark ? ACID : '#c7d600',
    secondaryLight: '#f4ff86',
    secondaryDark: '#aebc00',
    page: dark ? '#0b0b10' : PAPER,
    paper: dark ? '#111117' : '#fffefa',
    elevated: dark ? '#17171f' : '#fffefa',
    header: HERMES_BLUE,
    panel: dark ? '#111117' : '#fffefa',
    subtle: dark ? 'rgba(248,247,242,0.065)' : 'rgba(0,0,242,0.055)',
    hover: dark ? 'rgba(237,255,69,0.1)' : 'rgba(0,0,242,0.085)',
    line: dark ? 'rgba(248,247,242,0.34)' : 'rgba(0,0,242,0.3)',
    text: dark ? '#f8f7f2' : '#0000c8',
    textSecondary: dark ? 'rgba(248,247,242,0.72)' : '#4d4db0',
    shadow: 'none',
    menuShadow: dark ? '0 0 0 1px rgba(248,247,242,0.5)' : '0 0 0 1px rgba(0,0,242,0.35)',
    pageGradient: dark ? '#0b0b10' : PAPER,
    displayFont: "'Bodoni Moda', 'Bodoni 72', Didot, 'Times New Roman', serif",
    monoFont: "'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
  };
}

function createAppTheme(mode) {
  const tokens = modeTokens(mode);
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.primary,
        light: tokens.primaryLight,
        dark: tokens.primaryDark,
        contrastText: darkContrast(mode),
      },
      secondary: {
        main: tokens.secondary,
        light: tokens.secondaryLight,
        dark: tokens.secondaryDark,
        contrastText: HERMES_BLUE,
      },
      error: { main: darkColor(mode, '#ff9c9c', '#c62828') },
      warning: { main: darkColor(mode, '#ffdc73', '#9b6400') },
      success: { main: darkColor(mode, '#a9f5bd', '#087a42') },
      background: { default: tokens.page, paper: tokens.paper },
      text: { primary: tokens.text, secondary: tokens.textSecondary },
      divider: tokens.line,
    },
    shape: { borderRadius: 0 },
    typography: {
      fontFamily: tokens.monoFont,
      h1: { fontFamily: tokens.displayFont, fontWeight: 400, lineHeight: 0.92, letterSpacing: 0 },
      h2: { fontFamily: tokens.displayFont, fontWeight: 400, lineHeight: 0.94, letterSpacing: 0 },
      h3: { fontFamily: tokens.displayFont, fontWeight: 400, lineHeight: 0.98, letterSpacing: 0 },
      h4: { fontFamily: tokens.displayFont, fontWeight: 400, lineHeight: 1, letterSpacing: 0 },
      h5: { fontFamily: tokens.displayFont, fontWeight: 400, lineHeight: 1.05, letterSpacing: 0 },
      h6: { fontFamily: tokens.displayFont, fontWeight: 400, lineHeight: 1.1, letterSpacing: 0 },
      subtitle1: { fontWeight: 700, letterSpacing: 0 },
      subtitle2: { fontWeight: 700, letterSpacing: 0 },
      overline: { fontFamily: tokens.monoFont, fontWeight: 700, letterSpacing: 0, lineHeight: 1.5 },
      caption: { fontFamily: tokens.monoFont, letterSpacing: 0 },
      button: { fontFamily: tokens.monoFont, fontWeight: 700, letterSpacing: 0, textTransform: 'uppercase' },
    },
    components: buildComponents(tokens, mode),
  });

  theme.ep = tokens;
  return theme;
}

function darkContrast(mode) {
  return mode === 'dark' ? HERMES_BLUE : '#f8f7f2';
}

function darkColor(mode, darkValue, lightValue) {
  return mode === 'dark' ? darkValue : lightValue;
}

function buildComponents(tokens, mode) {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        '@keyframes epFadeUp': {
          from: { opacity: 0, transform: 'translate3d(0, 12px, 0)' },
          to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        },
        '@keyframes epScaleIn': {
          from: { opacity: 0, transform: 'scale(0.985)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        '@keyframes epSoftPulse': {
          '0%, 100%': { opacity: 0.72 },
          '50%': { opacity: 1 },
        },
        '@keyframes epFloat': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -5px, 0)' },
        },
        body: {
          background: tokens.page,
          color: tokens.text,
          fontFamily: tokens.monoFont,
          transition: 'background-color 180ms ease, color 180ms ease',
        },
        '.ep-page': { animation: 'epFadeUp 420ms ease-out both' },
        '.ep-animate-in': { animation: 'epFadeUp 480ms ease-out both' },
        '.ep-scale-in': { animation: 'epScaleIn 220ms ease-out both' },
        '.ep-stagger > *': { animation: 'epFadeUp 460ms ease-out both' },
        '.ep-stagger > *:nth-of-type(2)': { animationDelay: '55ms' },
        '.ep-stagger > *:nth-of-type(3)': { animationDelay: '110ms' },
        '.ep-stagger > *:nth-of-type(4)': { animationDelay: '165ms' },
        '.ep-stagger > *:nth-of-type(5)': { animationDelay: '220ms' },
        '.ep-display': { fontFamily: tokens.displayFont, fontWeight: 400, letterSpacing: 0 },
        '.ep-kicker': { fontFamily: tokens.monoFont, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 },
        '.MuiPaper-root, .MuiCard-root, .MuiButton-root, .MuiIconButton-root, .MuiFab-root, .MuiChip-root, .MuiAvatar-root, .MuiOutlinedInput-root, .MuiAlert-root, .MuiLinearProgress-root, .MuiLinearProgress-bar': {
          borderRadius: '0 !important',
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.001ms !important',
            animationIterationCount: '1 !important',
            scrollBehavior: 'auto !important',
            transitionDuration: '0.001ms !important',
          },
        },
        '::selection': { backgroundColor: ACID, color: HERMES_BLUE },
        '::-webkit-scrollbar-track': { background: tokens.page },
        '::-webkit-scrollbar-thumb': { background: tokens.primary, borderRadius: 0 },
        '::-webkit-scrollbar-thumb:hover': { background: tokens.secondary },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0, square: true },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
          borderRadius: 0,
          transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease',
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0, square: true },
      styleOverrides: { root: { borderRadius: 0, boxShadow: 'none' } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          border: `1px solid ${tokens.line}`,
          boxShadow: tokens.menuShadow,
          animation: 'epScaleIn 160ms ease-out both',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 0, border: `1px solid ${tokens.line}`, boxShadow: tokens.menuShadow },
        list: { padding: 0 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          margin: 0,
          minHeight: 42,
          borderBottom: `1px solid ${tokens.line}`,
          '&:last-of-type': { borderBottom: 0 },
          '&:hover': { backgroundColor: tokens.hover },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 0,
          minHeight: 40,
          boxShadow: 'none',
          paddingInline: 18,
          transition: 'background-color 140ms ease, color 140ms ease, border-color 140ms ease',
          '&:hover': { boxShadow: 'none' },
        },
        outlined: { borderColor: tokens.line, borderWidth: 1, '&:hover': { borderWidth: 1 } },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          transition: 'background-color 140ms ease, color 140ms ease',
          '&:hover': { backgroundColor: tokens.hover },
        },
      },
    },
    MuiFab: {
      styleOverrides: { root: { borderRadius: 0, boxShadow: 'none', '&:hover': { boxShadow: 'none' } } },
    },
    MuiTextField: { defaultProps: { variant: 'outlined' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: mode === 'dark' ? alpha('#ffffff', 0.045) : 'transparent',
          '& fieldset': { borderColor: tokens.line },
          '&:hover fieldset': { borderColor: tokens.primary },
          '&.Mui-focused fieldset': { borderColor: tokens.primary, borderWidth: 1 },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 0, fontFamily: tokens.monoFont, fontWeight: 700 } },
    },
    MuiAvatar: { styleOverrides: { root: { borderRadius: 0 } } },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 0 }, bar: { borderRadius: 0 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 0, border: `1px solid ${tokens.line}` } },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderColor: tokens.line, fontFamily: tokens.monoFont } },
    },
    MuiTooltip: { defaultProps: { arrow: true } },
  };
}

function getInitialMode() {
  if (typeof window === 'undefined') return 'light';
  const savedMode = localStorage.getItem(THEME_STORAGE_KEY);
  return savedMode === 'dark' || savedMode === 'light' ? savedMode : 'light';
}

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const value = useMemo(() => ({
    mode,
    followsSystem: false,
    toggleMode: () => {
      setMode((currentMode) => {
        const nextMode = currentMode === 'dark' ? 'light' : 'dark';
        window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
        return nextMode;
      });
    },
  }), [mode]);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
