import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, Theme } from './theme';

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
