# FASE 3 — Scan de comida por IA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Regras globais das fases anteriores valem (TDD, strings pt-BR, commit+push por task).

**Goal:** Foto → proxy Fastify (chave do AI Hub só no servidor) → candidatos com confiança → confirmação cruzada com TACO → registro `origin:'scan'`. Transparente: zero config no app.

### Task 1: Servidor proxy (`server/`)
- Scaffold Node+TS+Fastify: package.json (scripts dev/build/start/test), tsconfig strict, vitest.
- `src/hub.ts`: `buildHubMessages(imageBase64, mime)` (prompt visão JSON estrito pt-BR) e `parseHubContent(content): {foods:[{name, portionGrams|null, confidence 0..1}]}` com zod, tolerante a cercas ```json.
- `src/server.ts`: `buildServer({ callHub })` com `POST /scan-food` (valida body, limite 8 MB, APP_TOKEN opcional, mapeia erros upstream → 502) e `GET /health`. `src/index.ts` lê env e usa fetch real.
- Testes: parser (3 casos) + rota via inject (sucesso, body inválido 400, upstream falha 502).
- Dockerfile (node:22-alpine, build multi-stage), docker-compose.yml, .env.example, README curto.
- Commit + push.

### Task 2: VisionProvider remoto no app
- Interface: `FoodRecognition.candidates` ganha `portionGrams?: number | null`.
- `RemoteVisionProvider`: `expo-file-system` lê a foto em base64 → `fetch(EXPO_PUBLIC_SCAN_URL + '/scan-food')` → mapeia `foods` (1º = label/confidence; todos em candidates). Erros → throw com mensagem neutra.
- `getVisionProvider()`: remoto se `process.env.EXPO_PUBLIC_SCAN_URL`; senão Unconfigured. `.env` do app com exemplo.
- `foodLogRepo.addFoodLog` ganha `origin?: LogOrigin` (default manual).
- Testes: provider com fetch mockado (mapeamento + erro); repo origin.
- Commit + push.

### Task 3: Fluxo de scan na Refeição
- `npx expo install expo-image-picker expo-file-system` (plugin + permissões com justificativa em app.json).
- Strings `meal.scan*` (Escanear, Analisando foto…, falha neutra, confiança, indisponível).
- MealScreen: botão Escanear (visível só com provider configurado) → ImagePicker (câmera/galeria) → loading → candidatos (ListRow com % confiança) → seleção busca TACO (`searchFoods`); match → card TACO com porção estimada pré-preenchida; sem match → aba manual pré-preenchida com nome/porção. Salva com `origin:'scan'`. Erro → mensagem + permanece no manual.
- Teste: mock provider/picker; fluxo candidato→TACO→addFoodLog origin scan.
- Commit + push.

### Task 4: Verificação + privacidade + entrega
- App: tsc, jest, expo-doctor, export android. Server: vitest + `docker build` (se docker disponível; senão registrar).
- PRIVACY.md: seção do scan (rede opt-in por foto, não armazenada).
- Prévia (Artifact): tela de scan. Memória. Instruções de deploy (.env + docker compose up) na mensagem final.
