# Leve

Diário de saúde para quem faz tratamento com GLP-1 (semaglutida, tirzepatida e afins).

Registre água, refeições, peso, doses, sintomas e ciclo; acompanhe composição corporal,
sono e frequência cardíaca importados do Apple Saúde ou do Health Connect; identifique
alimentos por foto; e mantenha lembretes de remédios — tudo local-first, com backup
criptografado opcional.

## Estrutura

- [`mobile/`](mobile/) — app iOS/Android (React Native + Expo + TypeScript)
- [`server/`](server/) — API (Fastify + PostgreSQL): contas, backup e proxy do scan de alimentos
- [`PROJECT_SPEC.md`](PROJECT_SPEC.md) — especificação do produto
- [`PRIVACY.md`](PRIVACY.md) — postura de privacidade (LGPD)

## Desenvolvimento

```bash
# App
cd mobile && npm install && npm start     # testes: npm test

# Servidor
cd server && npm install && npm run dev   # testes: npm test
# produção: cp .env.example .env && docker compose up -d --build
```

O app não substitui orientação médica: ele registra e organiza; decisões sobre dose e
tratamento são do médico de cada pessoa.
