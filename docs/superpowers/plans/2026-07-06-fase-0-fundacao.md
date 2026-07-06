# FASE 0 — Fundação do app "Leve" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold do app React Native (Expo + TypeScript) "Leve" com design system próprio, banco SQLite/Drizzle com migrations, onboarding com disclaimer médico obrigatório e 4 abas base — sem funcionalidade de registro ainda (Fase 1).

**Architecture:** App Expo em `mobile/` (raiz do repo reservada a docs e, futuramente, backend). Expo Router para navegação; design system em `mobile/src/design`; domínio em `mobile/src/core`; SQLite via expo-sqlite + Drizzle com migrations geradas por drizzle-kit; integrações de plataforma (saúde, visão) atrás de interfaces em `mobile/src/services` com stubs. Onboarding grava aceite do disclaimer na tabela `profile`; as abas redirecionam para o onboarding se não houver aceite.

**Tech Stack:** Expo (SDK atual via `create-expo-app`), TypeScript estrito, Expo Router, expo-sqlite + drizzle-orm + drizzle-kit, react-native-svg, jest-expo + @testing-library/react-native, better-sqlite3 (somente testes Node).

## Global Constraints

- Nome do app: **Leve** (identidade original; NUNCA copiar nome/marca/visual de Glowise, Shotsy ou similares).
- Disclaimer médico obrigatório, texto exato: "O Leve é uma ferramenta de registro e organização; não substitui orientação médica. Decisões sobre dose e tratamento são do seu médico."
- Todo texto de UI em pt-BR e centralizado em `mobile/src/i18n/pt-BR.ts` (nenhuma string de UI hardcoded em tela).
- Local-first: nenhuma chamada de rede em runtime nesta fase.
- Sem promessas de perda de peso em nenhum texto.
- Integrações de plataforma somente atrás de interfaces (`HealthProvider`, `VisionProvider`).
- Instalar pacotes Expo sempre com `npx expo install` (compatibilidade de versões).
- Commits frequentes; mensagens `feat:`/`test:`/`chore:` com trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Shell: PowerShell (Windows). Todos os comandos rodam a partir de `c:\Users\Jorge Brito\Downloads\Projetos\bem-estar` salvo indicação.

---

### Task 1: Scaffold Expo + tooling de testes

**Files:**
- Create: `mobile/` (via create-expo-app, template default com TS + expo-router)
- Modify: `mobile/package.json` (scripts test/lint), `mobile/tsconfig.json` (strict), `mobile/app.json` (nome Leve)
- Create: `mobile/jest.config.js`

**Interfaces:**
- Produces: projeto Expo compilável em `mobile/`; `npm test` (jest-expo) e `npx tsc --noEmit` funcionando; alias `@/*` → `mobile/*`.

- [ ] **Step 1: Verificar node e criar o app**

```powershell
node --version   # esperado >= 20
npx create-expo-app@latest mobile --template default
```

- [ ] **Step 2: Limpar código de exemplo do template**

O template default traz telas de exemplo. Remover diretórios/arquivos de exemplo mantendo a estrutura:

```powershell
Remove-Item -Recurse -Force mobile\app\(tabs), mobile\components, mobile\hooks, mobile\constants, mobile\scripts -ErrorAction SilentlyContinue
Remove-Item -Force mobile\app\+not-found.tsx, mobile\app\_layout.tsx -ErrorAction SilentlyContinue
```

(Se os caminhos do template atual diferirem, remover o equivalente: telas de exemplo, componentes de exemplo e script reset-project; manter `assets/`.)

- [ ] **Step 3: Criar `mobile/app/_layout.tsx` mínimo (placeholder até a Task 7)**

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

E `mobile/app/index.tsx` temporário:

```tsx
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Leve</Text>
    </View>
  );
}
```

- [ ] **Step 4: TypeScript estrito**

Em `mobile/tsconfig.json`, garantir:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

- [ ] **Step 5: Instalar e configurar Jest**

```powershell
cd mobile
npx expo install jest-expo jest @types/jest -- --save-dev
npm install --save-dev @testing-library/react-native
```

Criar `mobile/jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|drizzle-orm))',
  ],
};
```

Adicionar em `mobile/package.json` → `"scripts"`: `"test": "jest"`.

- [ ] **Step 6: Identidade em `mobile/app.json`**

Ajustar campos (manter o restante do template):

```json
{
  "expo": {
    "name": "Leve",
    "slug": "leve",
    "scheme": "leve",
    "splash": { "backgroundColor": "#F0FDFA" }
  }
}
```

- [ ] **Step 7: Sanidade — typecheck e teste dummy**

Criar `mobile/src/__tests__/sanity.test.ts`:

```ts
test('jest funciona', () => {
  expect(1 + 1).toBe(2);
});
```

Run: `cd mobile; npx tsc --noEmit; npm test`
Expected: typecheck sem erros; 1 teste PASS.

- [ ] **Step 8: Commit**

```powershell
git add -A
git commit -m "chore: scaffold Expo + TypeScript estrito + jest (app Leve em mobile/)"
```

---

### Task 2: Strings pt-BR (i18n)

**Files:**
- Create: `mobile/src/i18n/pt-BR.ts`
- Test: `mobile/src/i18n/__tests__/pt-BR.test.ts`

**Interfaces:**
- Produces: `strings` (objeto tipado) importado por todas as telas; `strings.disclaimer.medical` é o texto canônico do disclaimer.

- [ ] **Step 1: Teste que falha**

```ts
import { strings } from '../pt-BR';

test('disclaimer médico canônico presente', () => {
  expect(strings.disclaimer.medical).toContain('não substitui orientação médica');
  expect(strings.disclaimer.medical).toContain('Decisões sobre dose e tratamento são do seu médico');
});

test('sem promessas de perda de peso', () => {
  const all = JSON.stringify(strings).toLowerCase();
  expect(all).not.toMatch(/emagre[cç]|perder peso garantido|resultado garantido/);
});
```

Run: `cd mobile; npm test -- pt-BR` — Expected: FAIL (módulo não existe).

- [ ] **Step 2: Implementar `mobile/src/i18n/pt-BR.ts`**

```ts
export const strings = {
  appName: 'Leve',
  tagline: 'Seu diário de saúde',
  disclaimer: {
    medical:
      'O Leve é uma ferramenta de registro e organização; não substitui orientação médica. ' +
      'Decisões sobre dose e tratamento são do seu médico.',
  },
  onboarding: {
    welcomeTitle: 'Bem-vindo ao Leve',
    welcomeBody:
      'Registre água, refeições, peso, sintomas e as doses do seu tratamento — tudo fica no seu aparelho.',
    privacyNote: 'Seus dados ficam no seu aparelho. Nada é enviado sem o seu consentimento.',
    acceptLabel: 'Li e entendi',
    continueButton: 'Começar',
  },
  tabs: { today: 'Hoje', log: 'Registrar', progress: 'Progresso', profile: 'Perfil' },
  today: {
    emptyTitle: 'Nada registrado hoje',
    emptyHint: 'Use a aba Registrar para adicionar água, refeições, peso ou doses.',
  },
  log: {
    title: 'O que você quer registrar?',
    water: 'Água',
    meal: 'Refeição',
    dose: 'Dose de medicação',
    weight: 'Peso',
    symptom: 'Sintoma',
    comingSoon: 'Disponível na próxima fase',
  },
  progress: {
    emptyTitle: 'Seus gráficos aparecerão aqui',
    emptyHint: 'Registre peso, água e refeições para acompanhar seu progresso.',
  },
  profile: {
    title: 'Perfil',
    privacySection: 'Privacidade',
    exportData: 'Exportar meus dados',
    deleteData: 'Excluir meus dados',
    comingSoon: 'Disponível em breve',
  },
  common: { loading: 'Carregando…', error: 'Algo deu errado', retry: 'Tentar novamente' },
} as const;
```

- [ ] **Step 3: Rodar testes** — `npm test -- pt-BR` — Expected: PASS.

- [ ] **Step 4: Commit** — `git add -A; git commit -m "feat: strings pt-BR centralizadas com disclaimer canônico"`

---

### Task 3: Design tokens + tema claro/escuro

**Files:**
- Create: `mobile/src/design/tokens.ts`, `mobile/src/design/theme.ts`, `mobile/src/design/useTheme.ts`
- Test: `mobile/src/design/__tests__/theme.test.ts`

**Interfaces:**
- Produces: `Theme` (`{ mode, colors: { background, surface, border, text, textMuted, primary, onPrimary, success, warning, danger } }`), `lightTheme`, `darkTheme`, hook `useTheme(): Theme`, e `spacing/radius/typeScale` de `tokens.ts`.

- [ ] **Step 1: Teste que falha** (`theme.test.ts`)

```ts
import { lightTheme, darkTheme } from '../theme';

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
```

Run: `npm test -- theme` — Expected: FAIL.

- [ ] **Step 2: Implementar `tokens.ts`**

```ts
export const palette = {
  teal50: '#F0FDFA', teal100: '#CCFBF1', teal300: '#5EEAD4',
  teal500: '#14B8A6', teal600: '#0F766E', teal700: '#115E59',
  white: '#FFFFFF', stone50: '#FAFAF9', stone100: '#F5F5F4', stone200: '#E7E5E4',
  stone400: '#A8A29E', stone600: '#57534E', stone900: '#1C1917',
  green700: '#15803D', green400: '#4ADE80',
  amber700: '#B45309', amber400: '#FBBF24',
  red700: '#B91C1C', red400: '#F87171',
  darkBg: '#101514', darkSurface: '#1B2220', darkBorder: '#2C3532',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 20 } as const;
export const typeScale = { display: 28, title: 22, body: 16, caption: 13 } as const;
```

- [ ] **Step 3: Implementar `theme.ts`**

```ts
import { palette } from './tokens';

export interface ThemeColors {
  background: string; surface: string; border: string;
  text: string; textMuted: string;
  primary: string; onPrimary: string;
  success: string; warning: string; danger: string;
}
export interface Theme { mode: 'light' | 'dark'; colors: ThemeColors }

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: palette.stone50, surface: palette.white, border: palette.stone200,
    text: palette.stone900, textMuted: palette.stone600,
    primary: palette.teal600, onPrimary: palette.white,
    success: palette.green700, warning: palette.amber700, danger: palette.red700,
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: palette.darkBg, surface: palette.darkSurface, border: palette.darkBorder,
    text: palette.stone100, textMuted: palette.stone400,
    primary: palette.teal300, onPrimary: palette.darkBg,
    success: palette.green400, warning: palette.amber400, danger: palette.red400,
  },
};
```

- [ ] **Step 4: Implementar `useTheme.ts`**

```ts
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, Theme } from './theme';

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
```

- [ ] **Step 5: Rodar testes** — `npm test -- theme` — Expected: PASS.

- [ ] **Step 6: Commit** — `git commit -am "feat: design tokens e tema claro/escuro do Leve"` (usar `git add -A` antes).

---

### Task 4: Componentes base do design system

**Files:**
- Create: `mobile/src/design/components/AppText.tsx`, `Button.tsx`, `Card.tsx`, `Screen.tsx`, `Input.tsx`, `EmptyState.tsx`, `DisclaimerBanner.tsx`, `index.ts`
- Test: `mobile/src/design/components/__tests__/components.test.tsx`

**Interfaces:**
- Consumes: `useTheme`, `spacing/radius/typeScale`, `strings.disclaimer.medical`.
- Produces: `<AppText variant onCard? muted?>`, `<Button label onPress variant? disabled?>`, `<Card>`, `<Screen>`, `<Input label value onChangeText>`, `<EmptyState title hint icon?>`, `<DisclaimerBanner>` — exportados de `@/src/design/components`.

- [ ] **Step 1: Teste que falha** (`components.test.tsx`)

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button, DisclaimerBanner, EmptyState } from '../index';
import { strings } from '@/src/i18n/pt-BR';

test('DisclaimerBanner mostra o texto canônico', () => {
  const { getByText } = render(<DisclaimerBanner />);
  getByText(strings.disclaimer.medical);
});

test('Button dispara onPress e respeita disabled', () => {
  const onPress = jest.fn();
  const { getByText, rerender } = render(<Button label="Ok" onPress={onPress} />);
  fireEvent.press(getByText('Ok'));
  expect(onPress).toHaveBeenCalledTimes(1);
  rerender(<Button label="Ok" onPress={onPress} disabled />);
  fireEvent.press(getByText('Ok'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('EmptyState renderiza título e dica', () => {
  const { getByText } = render(<EmptyState title="Vazio" hint="Dica" />);
  getByText('Vazio');
  getByText('Dica');
});
```

Run: `npm test -- components` — Expected: FAIL.

- [ ] **Step 2: Implementar componentes**

`AppText.tsx`:

```tsx
import { Text, TextProps } from 'react-native';
import { typeScale } from '../tokens';
import { useTheme } from '../useTheme';

type Variant = keyof typeof typeScale;
interface Props extends TextProps { variant?: Variant; muted?: boolean }

export function AppText({ variant = 'body', muted, style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: typeScale[variant],
          fontWeight: variant === 'display' || variant === 'title' ? '600' : '400',
          color: muted ? colors.textMuted : colors.text,
        },
        style,
      ]}
      {...rest}
    />
  );
}
```

`Button.tsx`:

```tsx
import { Pressable } from 'react-native';
import { radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { AppText } from './AppText';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled }: Props) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: isPrimary ? colors.primary : 'transparent',
        borderWidth: isPrimary ? 0 : 1,
        borderColor: colors.primary,
        borderRadius: radius.md,
        paddingVertical: spacing.sm + 4,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
      })}
    >
      <AppText style={{ color: isPrimary ? colors.onPrimary : colors.primary, fontWeight: '600' }}>
        {label}
      </AppText>
    </Pressable>
  );
}
```

`Card.tsx`:

```tsx
import { View, ViewProps } from 'react-native';
import { radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';

export function Card({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        style,
      ]}
      {...rest}
    />
  );
}
```

`Screen.tsx`:

```tsx
import { PropsWithChildren } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../tokens';
import { useTheme } from '../useTheme';

export function Screen({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
```

`Input.tsx`:

```tsx
import { TextInput, TextInputProps, View } from 'react-native';
import { radius, spacing, typeScale } from '../tokens';
import { useTheme } from '../useTheme';
import { AppText } from './AppText';

interface Props extends TextInputProps { label: string }

export function Input({ label, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" muted>{label}</AppText>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={{
          borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
          padding: spacing.sm + 2, color: colors.text, fontSize: typeScale.body,
          backgroundColor: colors.surface,
        }}
        {...rest}
      />
    </View>
  );
}
```

`EmptyState.tsx`:

```tsx
import { View } from 'react-native';
import { spacing } from '../tokens';
import { AppText } from './AppText';

interface Props { title: string; hint: string; icon?: string }

export function EmptyState({ title, hint, icon = '🌿' }: Props) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
      <AppText variant="display">{icon}</AppText>
      <AppText variant="title">{title}</AppText>
      <AppText muted style={{ textAlign: 'center' }}>{hint}</AppText>
    </View>
  );
}
```

`DisclaimerBanner.tsx`:

```tsx
import { View } from 'react-native';
import { strings } from '@/src/i18n/pt-BR';
import { radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { AppText } from './AppText';

export function DisclaimerBanner() {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
        backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
        borderLeftWidth: 3, borderLeftColor: colors.primary,
        borderRadius: radius.sm, padding: spacing.sm + 4,
      }}
    >
      <AppText variant="caption">ℹ️</AppText>
      <AppText variant="caption" muted style={{ flex: 1 }}>
        {strings.disclaimer.medical}
      </AppText>
    </View>
  );
}
```

`index.ts`:

```ts
export { AppText } from './AppText';
export { Button } from './Button';
export { Card } from './Card';
export { Screen } from './Screen';
export { Input } from './Input';
export { EmptyState } from './EmptyState';
export { DisclaimerBanner } from './DisclaimerBanner';
```

- [ ] **Step 3: Rodar testes** — `npm test -- components` — Expected: PASS (se `react-native-safe-area-context` não estiver instalado pelo template: `npx expo install react-native-safe-area-context`).

- [ ] **Step 4: Commit** — `git add -A; git commit -m "feat: componentes base do design system (inclui DisclaimerBanner)"`

---

### Task 5: Tipos de domínio + interfaces de serviços (Health/Vision)

**Files:**
- Create: `mobile/src/core/types.ts`
- Create: `mobile/src/services/health/HealthProvider.ts`, `mobile/src/services/vision/VisionProvider.ts`
- Test: `mobile/src/services/__tests__/providers.test.ts`

**Interfaces:**
- Produces: tipos `Profile, WaterLog, FoodLog, DoseLog, SymptomLog, WeightLog, FoodItem`; `HealthProvider` + `UnavailableHealthProvider` + `getHealthProvider()`; `VisionProvider` + `UnconfiguredVisionProvider` + `getVisionProvider()`.

- [ ] **Step 1: Teste que falha** (`providers.test.ts`)

```ts
import { getHealthProvider } from '../health/HealthProvider';
import { getVisionProvider } from '../vision/VisionProvider';

test('health provider padrão é indisponível mas seguro', async () => {
  const hp = getHealthProvider();
  await expect(hp.isAvailable()).resolves.toBe(false);
  await expect(hp.readWeight(new Date(0))).resolves.toEqual([]);
});

test('vision provider padrão rejeita com mensagem de fase', async () => {
  await expect(getVisionProvider().recognizeFood('file://foto.jpg')).rejects.toThrow(/Fase 3/);
});
```

Run: `npm test -- providers` — Expected: FAIL.

- [ ] **Step 2: Implementar `mobile/src/core/types.ts`**

```ts
export type LogOrigin = 'manual' | 'scan' | 'healthkit' | 'healthconnect';
export type DoseRoute = 'injecao' | 'pilula';

export interface Profile {
  id: number;
  name: string | null;
  heightCm: number | null;
  goalWeightKg: number | null;
  medication: string | null;
  disclaimerAcceptedAt: string | null; // ISO 8601
}

export interface WaterLog { id: number; amountMl: number; loggedAt: string }

export interface FoodLog {
  id: number; name: string; portionGrams: number | null;
  calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null;
  origin: LogOrigin; photoUri: string | null; loggedAt: string;
}

export interface DoseLog {
  id: number; medication: string; doseMg: number; route: DoseRoute;
  injectionSite: string | null; loggedAt: string; nextDoseAt: string | null;
}

export interface SymptomLog { id: number; kind: string; intensity: number; loggedAt: string }

export interface WeightLog { id: number; weightKg: number; origin: LogOrigin; loggedAt: string }

export interface FoodItem {
  id: number; name: string; referencePortion: string | null;
  calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null;
  source: 'taco' | 'internacional';
}
```

- [ ] **Step 3: Implementar `HealthProvider.ts`**

```ts
export interface WeightSample { kg: number; takenAt: Date; source: string }
export interface StepsSample { count: number; date: string }

export interface HealthProvider {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  readWeight(since: Date): Promise<WeightSample[]>;
  readSteps(since: Date): Promise<StepsSample[]>;
}

/** Padrão até a Fase 2 (HealthKit/Health Connect). */
export class UnavailableHealthProvider implements HealthProvider {
  async isAvailable() { return false; }
  async requestPermissions() { return false; }
  async readWeight() { return []; }
  async readSteps() { return []; }
}

export function getHealthProvider(): HealthProvider {
  return new UnavailableHealthProvider();
}
```

- [ ] **Step 4: Implementar `VisionProvider.ts`**

```ts
export interface FoodRecognition {
  label: string;
  confidence: number; // 0..1
  candidates: Array<{ label: string; confidence: number }>;
}

export interface VisionProvider {
  recognizeFood(photoUri: string): Promise<FoodRecognition>;
}

/** Padrão até a Fase 3 (AI Hub / API de visão). */
export class UnconfiguredVisionProvider implements VisionProvider {
  async recognizeFood(): Promise<FoodRecognition> {
    throw new Error('Scan de comida chega na Fase 3');
  }
}

export function getVisionProvider(): VisionProvider {
  return new UnconfiguredVisionProvider();
}
```

- [ ] **Step 5: Rodar testes** — `npm test -- providers` — Expected: PASS.

- [ ] **Step 6: Commit** — `git add -A; git commit -m "feat: tipos de domínio e interfaces HealthProvider/VisionProvider com stubs"`

---

### Task 6: Banco SQLite + Drizzle (schema, migrations, repositório de perfil)

**Files:**
- Create: `mobile/src/db/schema.ts`, `mobile/src/db/client.ts`, `mobile/src/db/profileRepo.ts`, `mobile/drizzle.config.ts`
- Create (gerado): `mobile/src/db/migrations/*`
- Test: `mobile/src/db/__tests__/profileRepo.test.ts`

**Interfaces:**
- Consumes: tipos de `@/src/core/types`.
- Produces: `db` (drizzle sobre expo-sqlite), tabelas drizzle exportadas de `schema.ts`, `getProfile(db)`, `acceptDisclaimer(db, now: Date)`; `migrations` importável de `@/src/db/migrations/migrations` para `useMigrations`.

- [ ] **Step 1: Instalar dependências**

```powershell
cd mobile
npx expo install expo-sqlite
npm install drizzle-orm
npm install --save-dev drizzle-kit better-sqlite3 @types/better-sqlite3
```

- [ ] **Step 2: Implementar `schema.ts`**

```ts
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  heightCm: real('height_cm'),
  goalWeightKg: real('goal_weight_kg'),
  medication: text('medication'),
  disclaimerAcceptedAt: text('disclaimer_accepted_at'),
});

export const waterLogs = sqliteTable('water_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amountMl: real('amount_ml').notNull(),
  loggedAt: text('logged_at').notNull(),
});

export const foodLogs = sqliteTable('food_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  portionGrams: real('portion_grams'),
  calories: real('calories'),
  proteinG: real('protein_g'),
  carbsG: real('carbs_g'),
  fatG: real('fat_g'),
  origin: text('origin').notNull().default('manual'),
  photoUri: text('photo_uri'),
  loggedAt: text('logged_at').notNull(),
});

export const doseLogs = sqliteTable('dose_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  medication: text('medication').notNull(),
  doseMg: real('dose_mg').notNull(),
  route: text('route').notNull(),
  injectionSite: text('injection_site'),
  loggedAt: text('logged_at').notNull(),
  nextDoseAt: text('next_dose_at'),
});

export const symptomLogs = sqliteTable('symptom_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind').notNull(),
  intensity: integer('intensity').notNull(),
  loggedAt: text('logged_at').notNull(),
});

export const weightLogs = sqliteTable('weight_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  weightKg: real('weight_kg').notNull(),
  origin: text('origin').notNull().default('manual'),
  loggedAt: text('logged_at').notNull(),
});

export const foodItems = sqliteTable('food_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  referencePortion: text('reference_portion'),
  calories: real('calories'),
  proteinG: real('protein_g'),
  carbsG: real('carbs_g'),
  fatG: real('fat_g'),
  source: text('source').notNull(),
});
```

- [ ] **Step 3: `drizzle.config.ts` e gerar migration**

```ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
```

Run: `npx drizzle-kit generate`
Expected: cria `src/db/migrations/0000_*.sql` e `src/db/migrations/migrations.js`.

- [ ] **Step 4: Implementar `client.ts`**

```ts
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

export const sqlite = openDatabaseSync('leve.db');
export const db = drizzle(sqlite, { schema });
export type AppDb = typeof db;
```

- [ ] **Step 5: Teste que falha** (`profileRepo.test.ts`, roda em Node com better-sqlite3)

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { acceptDisclaimer, getProfile } from '../profileRepo';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('perfil inexistente retorna null', async () => {
  expect(await getProfile(makeDb() as never)).toBeNull();
});

test('aceite do disclaimer cria e persiste perfil', async () => {
  const db = makeDb() as never;
  const now = new Date('2026-07-06T12:00:00Z');
  await acceptDisclaimer(db, now);
  const p = await getProfile(db);
  expect(p?.disclaimerAcceptedAt).toBe(now.toISOString());
});
```

Run: `npm test -- profileRepo` — Expected: FAIL (`profileRepo` não existe).

- [ ] **Step 6: Implementar `profileRepo.ts`**

```ts
import { eq } from 'drizzle-orm';
import type { Profile } from '@/src/core/types';
import type { AppDb } from './client';
import { profile } from './schema';

export async function getProfile(db: AppDb): Promise<Profile | null> {
  const rows = await db.select().from(profile).limit(1);
  return rows[0] ?? null;
}

export async function acceptDisclaimer(db: AppDb, now: Date): Promise<void> {
  const existing = await getProfile(db);
  const acceptedAt = now.toISOString();
  if (existing) {
    await db.update(profile).set({ disclaimerAcceptedAt: acceptedAt }).where(eq(profile.id, existing.id));
  } else {
    await db.insert(profile).values({ disclaimerAcceptedAt: acceptedAt });
  }
}
```

Nota: o teste injeta um drizzle/better-sqlite3 com `as never` — os repositórios só usam a interface de query comum aos dois drivers. Se o typecheck reclamar da assinatura, tipar o parâmetro como `AppDb` e manter o cast no teste.

- [ ] **Step 7: Rodar testes + typecheck** — `npm test -- profileRepo; npx tsc --noEmit` — Expected: PASS/limpo.

- [ ] **Step 8: Commit** — `git add -A; git commit -m "feat: schema Drizzle, migrations e repositório de perfil"`

---

### Task 7: Onboarding com disclaimer + gate de navegação

**Files:**
- Create: `mobile/src/features/onboarding/useOnboarding.ts`, `mobile/app/onboarding.tsx`
- Modify: `mobile/app/_layout.tsx` (migrations + Stack), delete `mobile/app/index.tsx` (substituído pelas abas na Task 8 — nesta task, `app/index.tsx` vira um redirect)
- Test: `mobile/src/features/onboarding/__tests__/useOnboarding.test.tsx`

**Interfaces:**
- Consumes: `db`, `getProfile`, `acceptDisclaimer`, componentes do design system, `strings`.
- Produces: `useOnboarding(): { loading: boolean; accepted: boolean; accept(): Promise<void> }`; rota `/onboarding`; root layout roda migrations antes de renderizar.

- [ ] **Step 1: Teste que falha** (`useOnboarding.test.tsx`)

```tsx
import { act, renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@/src/db/client', () => ({ db: {} }));
const getProfile = jest.fn();
const acceptDisclaimer = jest.fn();
jest.mock('@/src/db/profileRepo', () => ({
  getProfile: (...a: unknown[]) => getProfile(...a),
  acceptDisclaimer: (...a: unknown[]) => acceptDisclaimer(...a),
}));

import { useOnboarding } from '../useOnboarding';

test('sem perfil → não aceito; accept() persiste e atualiza', async () => {
  getProfile.mockResolvedValue(null);
  const { result } = renderHook(() => useOnboarding());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.accepted).toBe(false);

  acceptDisclaimer.mockResolvedValue(undefined);
  await act(() => result.current.accept());
  expect(acceptDisclaimer).toHaveBeenCalled();
  expect(result.current.accepted).toBe(true);
});

test('perfil com aceite → accepted true', async () => {
  getProfile.mockResolvedValue({ id: 1, disclaimerAcceptedAt: '2026-07-06T12:00:00Z' });
  const { result } = renderHook(() => useOnboarding());
  await waitFor(() => expect(result.current.accepted).toBe(true));
});
```

Run: `npm test -- useOnboarding` — Expected: FAIL.

- [ ] **Step 2: Implementar `useOnboarding.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';
import { db } from '@/src/db/client';
import { acceptDisclaimer, getProfile } from '@/src/db/profileRepo';

export function useOnboarding() {
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let active = true;
    getProfile(db)
      .then((p) => {
        if (active) setAccepted(Boolean(p?.disclaimerAcceptedAt));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const accept = useCallback(async () => {
    await acceptDisclaimer(db, new Date());
    setAccepted(true);
  }, []);

  return { loading, accepted, accept };
}
```

- [ ] **Step 3: Rodar teste** — `npm test -- useOnboarding` — Expected: PASS.

- [ ] **Step 4: Tela `app/onboarding.tsx`**

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Button, Card, DisclaimerBanner, Screen } from '@/src/design/components';
import { spacing } from '@/src/design/tokens';
import { useTheme } from '@/src/design/useTheme';
import { useOnboarding } from '@/src/features/onboarding/useOnboarding';
import { strings } from '@/src/i18n/pt-BR';

export default function Onboarding() {
  const { accept } = useOnboarding();
  const { colors } = useTheme();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onContinue() {
    setSaving(true);
    try {
      await accept();
      router.replace('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <AppText variant="display">{strings.onboarding.welcomeTitle}</AppText>
      <AppText muted>{strings.onboarding.welcomeBody}</AppText>
      <AppText variant="caption" muted>{strings.onboarding.privacyNote}</AppText>
      <Card style={{ gap: spacing.md }}>
        <DisclaimerBanner />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          onPress={() => setChecked((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
        >
          <View
            style={{
              width: 22, height: 22, borderRadius: 6, borderWidth: 2,
              borderColor: colors.primary,
              backgroundColor: checked ? colors.primary : 'transparent',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {checked ? <AppText variant="caption" style={{ color: colors.onPrimary }}>✓</AppText> : null}
          </View>
          <AppText>{strings.onboarding.acceptLabel}</AppText>
        </Pressable>
        <Button
          label={strings.onboarding.continueButton}
          onPress={onContinue}
          disabled={!checked || saving}
        />
      </Card>
    </Screen>
  );
}
```

- [ ] **Step 5: Root layout com migrations (`app/_layout.tsx`)**

```tsx
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Screen } from '@/src/design/components';
import { db } from '@/src/db/client';
import { strings } from '@/src/i18n/pt-BR';
import migrations from '@/src/db/migrations/migrations';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <Screen>
        <AppText variant="title">{strings.common.error}</AppText>
        <AppText muted>{error.message}</AppText>
      </Screen>
    );
  }
  if (!success) {
    return <View />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

(Se o import de `migrations.js` reclamar de tipos, adicionar `mobile/src/db/migrations/migrations.d.ts` com `declare const migrations: Record<string, unknown>; export default migrations;` — drizzle aceita o objeto gerado.)

- [ ] **Step 6: Redirect provisório em `app/index.tsx`** (vira abas na Task 8)

```tsx
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useOnboarding } from '@/src/features/onboarding/useOnboarding';

export default function Index() {
  const { loading, accepted } = useOnboarding();
  if (loading) return <View />;
  return accepted ? <View /> : <Redirect href="/onboarding" />;
}
```

- [ ] **Step 7: Typecheck + testes completos** — `npx tsc --noEmit; npm test` — Expected: tudo PASS.

- [ ] **Step 8: Commit** — `git add -A; git commit -m "feat: onboarding com aceite obrigatório do disclaimer médico"`

---

### Task 8: Abas Hoje / Registrar / Progresso / Perfil

**Files:**
- Create: `mobile/app/(tabs)/_layout.tsx`, `mobile/app/(tabs)/index.tsx` (Hoje), `mobile/app/(tabs)/registrar.tsx`, `mobile/app/(tabs)/progresso.tsx`, `mobile/app/(tabs)/perfil.tsx`
- Create: `mobile/src/features/screens/TodayScreen.tsx`, `LogHubScreen.tsx`, `ProgressScreen.tsx`, `ProfileScreen.tsx` (componentes puros, testáveis sem router/db)
- Delete: `mobile/app/index.tsx` (o grupo `(tabs)` assume a rota raiz)
- Test: `mobile/src/features/screens/__tests__/screens.test.tsx`

**Interfaces:**
- Consumes: design system, `strings`, `useOnboarding` (gate no layout das abas).
- Produces: rotas `/` (Hoje), `/registrar`, `/progresso`, `/perfil`; componentes de tela puros exportados de `@/src/features/screens/*`.

- [ ] **Step 1: Teste que falha** (`screens.test.tsx`)

```tsx
import { render } from '@testing-library/react-native';
import { strings } from '@/src/i18n/pt-BR';
import { LogHubScreen } from '../LogHubScreen';
import { ProfileScreen } from '../ProfileScreen';
import { ProgressScreen } from '../ProgressScreen';
import { TodayScreen } from '../TodayScreen';

test('Hoje mostra empty state', () => {
  const { getByText } = render(<TodayScreen />);
  getByText(strings.today.emptyTitle);
});

test('Registrar lista as 5 categorias como "em breve"', () => {
  const { getByText, getAllByText } = render(<LogHubScreen />);
  for (const label of [strings.log.water, strings.log.meal, strings.log.dose, strings.log.weight, strings.log.symptom]) {
    getByText(label);
  }
  expect(getAllByText(strings.log.comingSoon)).toHaveLength(5);
});

test('Progresso mostra empty state', () => {
  const { getByText } = render(<ProgressScreen />);
  getByText(strings.progress.emptyTitle);
});

test('Perfil mostra seção de privacidade com exportar/excluir', () => {
  const { getByText } = render(<ProfileScreen />);
  getByText(strings.profile.privacySection);
  getByText(strings.profile.exportData);
  getByText(strings.profile.deleteData);
});
```

Run: `npm test -- screens` — Expected: FAIL.

- [ ] **Step 2: Implementar os componentes de tela**

`TodayScreen.tsx`:

```tsx
import { AppText, EmptyState, Screen } from '@/src/design/components';
import { strings } from '@/src/i18n/pt-BR';

export function TodayScreen() {
  return (
    <Screen>
      <AppText variant="display">{strings.tabs.today}</AppText>
      <EmptyState title={strings.today.emptyTitle} hint={strings.today.emptyHint} icon="🌱" />
    </Screen>
  );
}
```

`LogHubScreen.tsx`:

```tsx
import { View } from 'react-native';
import { AppText, Card, Screen } from '@/src/design/components';
import { spacing } from '@/src/design/tokens';
import { strings } from '@/src/i18n/pt-BR';

const items = [
  { icon: '💧', label: strings.log.water },
  { icon: '🍽️', label: strings.log.meal },
  { icon: '💉', label: strings.log.dose },
  { icon: '⚖️', label: strings.log.weight },
  { icon: '📝', label: strings.log.symptom },
];

export function LogHubScreen() {
  return (
    <Screen>
      <AppText variant="display">{strings.log.title}</AppText>
      {items.map((item) => (
        <Card key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <AppText variant="title">{item.icon}</AppText>
          <View style={{ flex: 1 }}>
            <AppText>{item.label}</AppText>
            <AppText variant="caption" muted>{strings.log.comingSoon}</AppText>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
```

`ProgressScreen.tsx`:

```tsx
import { AppText, EmptyState, Screen } from '@/src/design/components';
import { strings } from '@/src/i18n/pt-BR';

export function ProgressScreen() {
  return (
    <Screen>
      <AppText variant="display">{strings.tabs.progress}</AppText>
      <EmptyState title={strings.progress.emptyTitle} hint={strings.progress.emptyHint} icon="📈" />
    </Screen>
  );
}
```

`ProfileScreen.tsx`:

```tsx
import { View } from 'react-native';
import { AppText, Card, DisclaimerBanner, Screen } from '@/src/design/components';
import { spacing } from '@/src/design/tokens';
import { strings } from '@/src/i18n/pt-BR';

export function ProfileScreen() {
  return (
    <Screen>
      <AppText variant="display">{strings.profile.title}</AppText>
      <DisclaimerBanner />
      <Card style={{ gap: spacing.sm }}>
        <AppText variant="title">{strings.profile.privacySection}</AppText>
        <View style={{ gap: spacing.xs }}>
          <AppText muted>{strings.profile.exportData}</AppText>
          <AppText variant="caption" muted>{strings.profile.comingSoon}</AppText>
        </View>
        <View style={{ gap: spacing.xs }}>
          <AppText muted>{strings.profile.deleteData}</AppText>
          <AppText variant="caption" muted>{strings.profile.comingSoon}</AppText>
        </View>
      </Card>
    </Screen>
  );
}
```

- [ ] **Step 3: Rodar testes** — `npm test -- screens` — Expected: PASS.

- [ ] **Step 4: Rotas das abas**

Excluir `mobile/app/index.tsx`. Criar `mobile/app/(tabs)/_layout.tsx`:

```tsx
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/src/design/useTheme';
import { useOnboarding } from '@/src/features/onboarding/useOnboarding';
import { strings } from '@/src/i18n/pt-BR';
import { AppText } from '@/src/design/components';

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return <AppText style={{ opacity: focused ? 1 : 0.45 }}>{glyph}</AppText>;
}

export default function TabsLayout() {
  const { loading, accepted } = useOnboarding();
  const { colors } = useTheme();

  if (loading) return <View />;
  if (!accepted) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: strings.tabs.today, tabBarIcon: (p) => <TabIcon glyph="🌱" {...p} /> }} />
      <Tabs.Screen name="registrar" options={{ title: strings.tabs.log, tabBarIcon: (p) => <TabIcon glyph="➕" {...p} /> }} />
      <Tabs.Screen name="progresso" options={{ title: strings.tabs.progress, tabBarIcon: (p) => <TabIcon glyph="📈" {...p} /> }} />
      <Tabs.Screen name="perfil" options={{ title: strings.tabs.profile, tabBarIcon: (p) => <TabIcon glyph="👤" {...p} /> }} />
    </Tabs>
  );
}
```

Cada rota é um wrapper fino:

```tsx
// app/(tabs)/index.tsx
import { TodayScreen } from '@/src/features/screens/TodayScreen';
export default TodayScreen;
```

```tsx
// app/(tabs)/registrar.tsx
import { LogHubScreen } from '@/src/features/screens/LogHubScreen';
export default LogHubScreen;
```

```tsx
// app/(tabs)/progresso.tsx
import { ProgressScreen } from '@/src/features/screens/ProgressScreen';
export default ProgressScreen;
```

```tsx
// app/(tabs)/perfil.tsx
import { ProfileScreen } from '@/src/features/screens/ProfileScreen';
export default ProfileScreen;
```

Ajustar `app/onboarding.tsx`: `router.replace('/')` já aponta para as abas.

- [ ] **Step 5: Typecheck + suíte completa** — `npx tsc --noEmit; npm test` — Expected: tudo PASS.

- [ ] **Step 6: Commit** — `git add -A; git commit -m "feat: abas Hoje/Registrar/Progresso/Perfil com gate de onboarding"`

---

### Task 9: Verificação final + prévia para o dono

**Files:**
- Create: `PRIVACY.md` (raiz do repo — rascunho inicial, evolui nas fases seguintes)
- Create: prévia HTML (scratchpad) publicada como Artifact

**Interfaces:**
- Consumes: tudo acima.

- [ ] **Step 1: Verificação completa**

```powershell
cd mobile
npx tsc --noEmit
npm test
npx expo-doctor
```

Expected: typecheck limpo, todos os testes PASS, expo-doctor sem erros críticos.

- [ ] **Step 2: Export web de sanidade (o bundle compila de ponta a ponta)**

```powershell
npx expo export --platform web
```

Expected: build conclui sem erro (mesmo que expo-sqlite não rode na web, o bundle Android/iOS é o alvo; se o export web falhar por módulo nativo, validar com `npx expo export --platform android` em vez disso).

- [ ] **Step 3: `PRIVACY.md` inicial (raiz)**

```markdown
# Privacidade — Leve (rascunho, FASE 0)

- O Leve é local-first: nesta fase, TODOS os dados ficam no aparelho (SQLite no sandbox do app). Nenhum dado sai do dispositivo.
- Dados tratados (localmente): perfil (metas, altura, medicação), água, refeições, doses, sintomas, peso.
- Criptografia em repouso: sandbox protegido pela criptografia do sistema (iOS Data Protection / Android FBE). SQLCipher será avaliado se exigido.
- Direitos do titular (LGPD): exportação e exclusão de dados terão telas dedicadas (previstas; entradas já visíveis no Perfil).
- Sem publicidade e sem uso de dados de saúde para marketing — dados de HealthKit/Health Connect (Fase 2) jamais serão usados para publicidade.
- Este documento é um rascunho técnico; a política de privacidade final deve ser revisada por advogado antes da publicação (Fase 6).
```

- [ ] **Step 4: Prévia visual para o dono** — gerar um HTML (scratchpad) reproduzindo as telas (onboarding + 4 abas) com os tokens reais do design system, claro/escuro, e publicar via Artifact. (Atende ao pedido "no final, mostre-me como está ficando".)

- [ ] **Step 5: Commit final**

```powershell
git add -A
git commit -m "docs: PRIVACY.md inicial (fase local-first)"
```

---

## Self-Review (executada)

- **Cobertura da spec (FASE 0):** projeto RN+TS ✅ (T1), navegação ✅ (T7/T8), design system + identidade ✅ (T3/T4, nome/paleta no app.json T1), telas base ✅ (T7/T8), armazenamento local ✅ (T6), disclaimer/design responsável ✅ (T2/T4/T7), interfaces de plataforma ✅ (T5), privacidade estrutural ✅ (T9 + entradas no Perfil).
- **Placeholders:** nenhum "TBD"; logo/ícone de loja explicitamente adiados para a Fase 6 (decisão YAGNI documentada no design doc) — o wordmark textual "Leve" cobre a FASE 0.
- **Consistência de tipos:** `AppDb`, `getProfile(db)`, `acceptDisclaimer(db, now)`, `useOnboarding()` usados uniformemente nas Tasks 6–8; `strings.*` conferido entre T2 e telas.
- **Risco conhecido:** versões de template do Expo mudam — T1 instrui remover "o equivalente" do código de exemplo; drizzle-kit `driver: 'expo'` é o mecanismo documentado para gerar `migrations.js`.
