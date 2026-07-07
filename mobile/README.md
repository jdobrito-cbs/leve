# Leve — app

App do Leve para iOS e Android (React Native + Expo + TypeScript).

```bash
npm install
npm start        # Expo (QR code para o aparelho)
npm test         # testes
npx tsc --noEmit # typecheck
```

- Rotas em `src/app` (Expo Router); domínio em `src/core`; banco local (SQLite + Drizzle)
  em `src/db`; design system em `src/design`; funcionalidades em `src/features`.
- Integrações de plataforma (HealthKit/Health Connect, visão) ficam atrás de interfaces
  em `src/services`.
- Recursos de saúde conectada e lembretes exigem um development build
  (`npx eas-cli build --profile development --platform android`); o restante roda no Expo Go.
- Variáveis de build: ver `.env.example` (URL do servidor para scan/conta).
