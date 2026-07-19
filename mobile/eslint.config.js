// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // Módulos nativos opcionais: require() dentro de try/catch é o padrão do
      // projeto para não derrubar Expo Go/web quando o módulo não existe.
      '@typescript-eslint/no-require-imports': 'off',
      // Efeitos de carga inicial (setState após ler o banco) são o padrão das
      // telas; o alerta dispara até no reset síncrono trivial. Fica como aviso
      // para novos casos serem olhados, sem reprovar o lint.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Reanimated: escrever em sharedValue.value é a API oficial (worklets);
    // a regra de imutabilidade do React Compiler não os reconhece.
    files: [
      'src/app/(tabs)/_layout.tsx',
      'src/design/components/Button.tsx',
      'src/design/components/IconChip.tsx',
      'src/design/components/useWaterPhysics.ts',
    ],
    rules: { 'react-hooks/immutability': 'off' },
  },
  {
    // Mocks de teste usam useEffect(cb, []) de propósito (passthrough de focus).
    files: ['**/__tests__/**'],
    rules: { 'react-hooks/exhaustive-deps': 'off' },
  },
]);
