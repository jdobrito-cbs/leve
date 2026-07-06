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
    background: palette.stone50,
    surface: palette.white,
    border: palette.stone200,
    text: palette.stone900,
    textMuted: palette.stone600,
    primary: palette.teal600,
    primarySoft: palette.teal100,
    onPrimary: palette.white,
    success: palette.green700,
    warning: palette.amber700,
    danger: palette.red700,
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: palette.darkBg,
    surface: palette.darkSurface,
    border: palette.darkBorder,
    text: palette.stone100,
    textMuted: palette.stone400,
    primary: palette.teal300,
    primarySoft: palette.tealSoftDark,
    onPrimary: palette.darkBg,
    success: palette.green400,
    warning: palette.amber400,
    danger: palette.red400,
  },
};
