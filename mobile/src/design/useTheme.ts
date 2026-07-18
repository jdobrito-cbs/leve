import { useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, Theme } from './theme';
import { getThemeSignal, subscribeTheme } from './themeSignal';

export function useTheme(): Theme {
  const system = useColorScheme();
  const override = useSyncExternalStore(subscribeTheme, getThemeSignal, getThemeSignal);
  const mode = override ?? (system === 'dark' ? 'dark' : 'light');
  return mode === 'dark' ? darkTheme : lightTheme;
}
