export const palette = {
  blue600: '#2563EB',
  blue500: '#3B82F6',
  blue400: '#60A5FA',
  blue700: '#1D4ED8',
  blue100: '#DBEAFE',
  blue50: '#EFF6FF',
  white: '#FFFFFF',
  slate50: '#F4F6FB',
  slate100: '#F1F5F9',
  slate200: '#E6EAF2',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate900: '#0F172A',
  green600: '#16A34A',
  green400: '#4ADE80',
  amber600: '#D97706',
  amber400: '#FBBF24',
  red600: '#DC2626',
  red400: '#F87171',
  navyBg: '#0B1220',
  navySurface: '#141D31',
  navyBorder: '#24304A',
  navySoft: '#1D2E52',
} as const;

export const fonts = {
  regular: 'Manrope_400Regular',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 24 } as const;
export const typeScale = { display: 28, title: 22, body: 16, caption: 13 } as const;
