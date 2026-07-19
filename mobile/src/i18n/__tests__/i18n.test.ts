import { strings } from '@/i18n/pt-BR';
import { LANGUAGES, setActiveLanguage } from '@/i18n/engine';

afterEach(() => setActiveLanguage('pt-BR'));

test('trocar o idioma muda as strings pelo proxy e voltar restaura', () => {
  const pt = strings.profile.save;
  setActiveLanguage('en-US');
  expect(strings.profile.save).not.toBe(pt);
  expect(strings.appName).toBe('Leve'); // nome do produto não se traduz
  setActiveLanguage('pt-BR');
  expect(strings.profile.save).toBe(pt);
});

test('todos os idiomas anunciados carregam e mantêm placeholders', () => {
  for (const { code } of LANGUAGES) {
    setActiveLanguage(code);
    // Chave de cada seção nova + placeholder preservado.
    expect(strings.language.sectionTitle.length).toBeGreaterThan(0);
    expect(strings.language.chooseTitle.length).toBeGreaterThan(0);
    expect(strings.reportPdf.title.length).toBeGreaterThan(0);
    expect(strings.profile.sleepDetected).toContain('{time}');
    expect(strings.meal.per100).toContain('{unit}');
    expect(strings.reminders.morningBody.length).toBeGreaterThan(0);
  }
});
