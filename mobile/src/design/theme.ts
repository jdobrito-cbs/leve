import { palette } from './tokens';

export interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  heroStart: string;
  heroEnd: string;
  onHero: string;
  success: string;
  warning: string;
  danger: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: palette.slate50,
    surface: palette.white,
    border: palette.slate200,
    text: palette.slate900,
    textMuted: palette.slate500,
    primary: palette.blue600,
    primarySoft: palette.blue100,
    onPrimary: palette.white,
    heroStart: palette.blue600,
    heroEnd: palette.blue400,
    onHero: palette.white,
    success: palette.green600,
    warning: palette.amber600,
    danger: palette.red600,
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: palette.navyBg,
    surface: palette.navySurface,
    border: palette.navyBorder,
    text: palette.slate100,
    textMuted: palette.slate400,
    primary: palette.blue400,
    primarySoft: palette.navySoft,
    onPrimary: palette.navyBg,
    heroStart: palette.blue700,
    heroEnd: palette.blue500,
    onHero: palette.white,
    success: palette.green400,
    warning: palette.amber400,
    danger: palette.red400,
  },
};
