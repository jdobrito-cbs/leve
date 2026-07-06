export const palette = {
  teal50: '#F0FDFA',
  teal100: '#CCFBF1',
  teal300: '#5EEAD4',
  teal500: '#14B8A6',
  teal600: '#0F766E',
  teal700: '#115E59',
  white: '#FFFFFF',
  stone50: '#FAFAF9',
  stone100: '#F5F5F4',
  stone200: '#E7E5E4',
  stone400: '#A8A29E',
  stone600: '#57534E',
  stone900: '#1C1917',
  green700: '#15803D',
  green400: '#4ADE80',
  amber700: '#B45309',
  amber400: '#FBBF24',
  red700: '#B91C1C',
  red400: '#F87171',
  darkBg: '#101514',
  darkSurface: '#1B2220',
  darkBorder: '#2C3532',
  tealSoftDark: '#1E3A34',
} as const;

export const fonts = {
  regular: 'Manrope_400Regular',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 20 } as const;
export const typeScale = { display: 28, title: 22, body: 16, caption: 13 } as const;
