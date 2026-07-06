# Design — FASE 0: Fundação do app + identidade "Leve"

Data: 2026-07-06
Status: aprovado pelo dono (stack, nome e direção visual confirmados)
Referência: [PROJECT_SPEC.md](../../../PROJECT_SPEC.md)

## Decisões tomadas

| Decisão | Escolha | Justificativa |
|---|---|---|
| Stack | React Native + Expo + TypeScript | TypeScript de ponta a ponta (backend Fastify na Fase 5 usa a mesma linguagem); Expo com prebuild + dev client suporta `react-native-health` (HealthKit) e `react-native-health-connect` via config plugins, então não precisamos de bare workflow; EAS permite builds iOS sem Mac no dia a dia; ecossistema JS facilita integrar o AI Hub do dono na Fase 3. Flutter foi avaliado (pacote `health` unifica as duas plataformas), mas adicionaria Dart como segunda linguagem sem ganho proporcional. |
| Navegação | Expo Router | File-based, construído sobre React Navigation, padrão atual do ecossistema Expo, deep links de graça (útil para lembretes nas fases futuras). |
| Nome | **Leve** | Original (não copia Glowise/Shotsy/afins). Português, curto, positivo: leveza no corpo e na rotina, sem prometer resultado de perda de peso (princípio de design responsável nº 4). Tagline: "Leve — seu diário de saúde". |
| Direção visual | Calmo clínico | Verde-água/teal suave + neutros, muito espaço em branco, tipografia limpa, modo claro e escuro. Transmite confiança e serenidade, adequado a um app de saúde com disclaimers visíveis. |
| Banco local | expo-sqlite + Drizzle ORM | SQL real com migrations versionadas (o modelo de dados da spec é relacional); Drizzle é type-safe e leve. WatermelonDB seria útil para sync complexo, mas a Fase 5 fará sync opt-in simples via API própria. MMKV/AsyncStorage não estruturam os logs. |
| Chave-valor sensível | expo-secure-store | Keychain/Keystore do sistema para segredos e flags sensíveis. |
| Criptografia em repouso | Padrão do SO nesta fase | iOS (Data Protection) e Android (File-Based Encryption) já criptografam o sandbox do app em aparelhos com bloqueio configurado. SQLCipher (via op-sqlite) fica documentado como opção futura se exigido por revisão de conformidade. |
| Idioma | pt-BR padrão, i18n estruturado | Strings centralizadas desde o início para não retrabalhar depois. |

## Escopo da FASE 0

Fundação técnica + identidade. **Nenhum registro funcional ainda** (isso é Fase 1).

### Estrutura de pastas

```
app/            → rotas/telas (expo-router)
src/design/     → design system: tokens, tema claro/escuro, componentes base
src/core/       → tipos de domínio (Profile, WaterLog, FoodLog, DoseLog, SymptomLog, WeightLog, FoodItem)
src/db/         → cliente SQLite + schema Drizzle + migrations
src/services/   → interfaces HealthProvider e VisionProvider (contratos + stubs; implementações reais nas Fases 2 e 3)
src/i18n/       → strings pt-BR
```

Princípio (spec, "Como quero que você trabalhe" nº 3): integrações de plataforma ficam atrás de interfaces desde o primeiro commit.

### Design system "Leve"

- Tokens: paleta (teal suave + neutros, semânticas de sucesso/alerta), tipografia, espaçamento, raios, com tema claro e escuro.
- Componentes base: `Screen`, `AppText`, `Button`, `Card`, `Input`, `EmptyState`, `DisclaimerBanner`.
- `DisclaimerBanner` existe desde a fundação porque o disclaimer médico é obrigatório em onboarding e telas de medicação (princípios de design responsável nº 1 e 2).
- Logo/ícone: wordmark + glifo original em SVG (placeholder de qualidade; refino antes da Fase 6).

### Telas base

- **Onboarding**: boas-vindas + disclaimer médico obrigatório ("Ferramenta de registro e organização; não substitui orientação médica. Decisões sobre dose e tratamento são do seu médico.") com aceite explícito antes de entrar no app.
- **Abas**: Hoje (dashboard com empty states), Registrar (hub dos futuros registros), Progresso (placeholder de gráficos), Perfil (metas/altura/medicação + seção Privacidade com "Exportar meus dados" e "Excluir meus dados" visíveis porém desabilitadas com nota "disponível em breve" — o compromisso aparece desde já).

### Banco de dados

- Schema Drizzle inicial cobrindo o modelo da spec (Profile + tabelas de log + FoodItem), com migration inicial gerada e aplicada na inicialização do app.
- Na FASE 0 apenas Profile é lido/escrito (onboarding grava o aceite do disclaimer e dados básicos opcionais); as demais tabelas existem mas só ganham UI na Fase 1.

### Testes

- Jest + React Native Testing Library.
- Unit: tokens/tema (contraste claro/escuro definidos), schema/migrations (abrem banco em memória), lógica de onboarding (não entra sem aceite).
- Smoke: navegação renderiza as 4 abas.

## Fora de escopo (fases futuras)

Registros de água/peso/dose/comida/sintomas (F1), base TACO (F1), HealthKit/Health Connect (F2), scan por IA (F3), farmacocinética (F4), backend/contas/sync (F5), lojas (F6).

## Ações do dono fora do código

Nenhuma nesta fase. (Conta Apple/Google Play só na Fase 6; builds de desenvolvimento Android e simulador iOS não exigem contas pagas.)

## Erros e riscos considerados

- Falha ao abrir/migrar o banco → tela de erro amigável com opção de tentar novamente; nunca crash silencioso.
- Usuário fecha o app no onboarding → aceite não persistido = onboarding reaparece (fail-safe: sem aceite, não entra).
- Versões de libs Expo movem rápido → fixar versões no package.json; `npx expo install` para compatibilidade.
