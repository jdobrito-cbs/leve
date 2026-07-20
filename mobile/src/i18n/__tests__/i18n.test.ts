import { strings } from '@/i18n/pt-BR';
import { getActiveLanguage, LANGUAGES, setActiveLanguage, subscribeLanguage } from '@/i18n/engine';

afterEach(() => setActiveLanguage('pt-BR'));

test('trocar o idioma notifica assinantes (o app re-renderiza na hora)', () => {
  const seen: string[] = [];
  const off = subscribeLanguage(() => seen.push(getActiveLanguage()));
  setActiveLanguage('en-US');
  expect(seen).toEqual(['en-US']);
  off();
  setActiveLanguage('fr');
  expect(seen).toEqual(['en-US']);
});

test('trocar o idioma muda as strings pelo proxy e voltar restaura', () => {
  const pt = strings.profile.save;
  setActiveLanguage('en-US');
  expect(strings.profile.save).not.toBe(pt);
  expect(strings.appName).toBe('Leve');
  setActiveLanguage('pt-BR');
  expect(strings.profile.save).toBe(pt);
});

test('todos os idiomas anunciados carregam e mantêm placeholders', () => {
  for (const { code } of LANGUAGES) {
    setActiveLanguage(code);
    expect(strings.language.sectionTitle.length).toBeGreaterThan(0);
    expect(strings.language.chooseTitle.length).toBeGreaterThan(0);
    expect(strings.reportPdf.title.length).toBeGreaterThan(0);
    expect(strings.profile.sleepDetected).toContain('{time}');
    expect(strings.meal.per100).toContain('{unit}');
    expect(strings.reminders.morningBody.length).toBeGreaterThan(0);
  }
});
