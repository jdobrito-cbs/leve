import { darkTheme, lightTheme } from '../theme';

test('temas claro e escuro definidos e distintos', () => {
  expect(lightTheme.mode).toBe('light');
  expect(darkTheme.mode).toBe('dark');
  expect(lightTheme.colors.background).not.toBe(darkTheme.colors.background);
  for (const theme of [lightTheme, darkTheme]) {
    for (const value of Object.values(theme.colors)) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/i);
    }
  }
});
