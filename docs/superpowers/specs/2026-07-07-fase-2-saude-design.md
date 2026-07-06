# Design — FASE 2: Integração com saúde (HealthKit / Health Connect)

Data: 2026-07-07
Status: aprovado pelo dono ("Aprovado, pode executar")
Referência: [PROJECT_SPEC.md](../../../PROJECT_SPEC.md) · [FASE 1](2026-07-07-fase-1-registros-design.md)

## Decisões

| Decisão | Escolha | Justificativa |
|---|---|---|
| Android | `react-native-health-connect` + config plugin (`expo-health-connect`) + `expo-build-properties` (minSdk 26) | Lib de referência para Health Connect; Samsung Health alimenta o Health Connect. |
| iOS | `@kingstinct/react-native-healthkit` (v14, config plugin, nitro-modules) | Mantida ativamente, plugin Expo. Implementado por tipos/docs; **não testável neste ambiente** (sem Mac) — adapter fino com fallback seguro. |
| Escopo de dados | Importar **peso** e **passos** (somente leitura) | Conforme spec F2; escrever de volta fica para fase futura. |
| Sync | Manual (botão "Importar agora") e leitura de passos ao abrir o Hoje | Sem background sync — menos permissões, mais previsível (LGPD/minimização). |
| Dedup de peso | Por `origin` + `loggedAt` ISO exato já existente | Import idempotente: reimportar não duplica. |
| Estado de conexão | `settings` key `health` = `{ connected: boolean }` | Reusa settingsRepo; permissão real é re-checada a cada uso. |
| Dev build | EAS Build (perfil development) | Módulos nativos ⇒ sai do Expo Go. Ação do dono: conta Expo gratuita + Android com Health Connect. |

## Arquitetura

- `src/services/health/HealthProvider.ts` (existente): interface mantém `isAvailable/requestPermissions/readWeight/readSteps`.
- Novos: `HealthConnectProvider.ts` (Android), `HealthKitProvider.ts` (iOS), factory `getHealthProvider()` decide por `Platform.OS` com import estático e try/catch de módulo nativo ausente → `UnavailableHealthProvider` (Expo Go continua abrindo o app, sem saúde).
- `src/services/health/healthSync.ts`: `importWeights(db, provider, sinceDays=90)` → lê amostras, filtra duplicadas (mesmo `loggedAt` com origin de saúde), insere via weightRepo com origin `healthconnect`/`healthkit`; retorna nº importado. `readTodaySteps(provider)` para o card do Hoje.
- `weightRepo.addWeight` ganha parâmetro opcional `origin` (default `'manual'`).
- Perfil: seção "Saúde" — estado (conectado/indisponível), botão conectar (initialize + requestPermission com tela do sistema), "Importar agora" (mostra "N pesos importados"), desconectar (limpa flag; instrui revogação no app do sistema).
- Hoje: card "Passos hoje" aparece só quando conectado e provider disponível.
- Pesos importados aparecem em Progresso/Hoje normalmente (mesma tabela), com origem gravada.

## Privacidade

Importação apenas por ação explícita do usuário; dados permanecem locais; nada de publicidade; PRIVACY.md atualizado com a seção de integrações de saúde.

## Testes

Providers mockados por módulo (jest.mock das libs nativas); testes reais de: factory fallback, `importWeights` (mapeamento + dedup) com better-sqlite3, UI do Perfil (conectar/importar chama serviço) e card de passos no Hoje.

## Fora de escopo

Escrita de volta (peso → HealthKit), background sync, outras métricas (sono, FC), iOS testado em aparelho.

## Ação do dono

Criar conta Expo gratuita (expo.dev) para EAS Build; Android com app Health Connect (nativo no Android 14+). Passo a passo será entregue ao final da fase.
