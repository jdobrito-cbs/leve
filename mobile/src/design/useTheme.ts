import { useSyncExternalStore } from 'react';
import { darkTheme, lightTheme, Theme } from './theme';
import { getThemeSignal, subscribeTheme } from './themeSignal';

export function useTheme(): Theme {
  const override = useSyncExternalStore(subscribeTheme, getThemeSignal, getThemeSignal);
  const mode = override ?? 'light';
  return mode === 'dark' ? darkTheme : lightTheme;
}
