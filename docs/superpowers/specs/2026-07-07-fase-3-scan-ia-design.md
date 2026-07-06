# Design — FASE 3: Scan de comida por IA (proxy transparente)

Data: 2026-07-07 · Status: aprovado ("Aprovado, pode executar")

## Arquitetura

App → **servidor proxy do Leve** (`server/`, Node+TS+Fastify+Docker — embrião do backend F5) → AI Hub do dono (upstream **OpenAI-compatível** configurado só por env do servidor: `HUB_BASE_URL`, `HUB_API_KEY`, `HUB_MODEL`). Zero configuração/chave no app: apenas `EXPO_PUBLIC_SCAN_URL` embutida no build. Transparente para o usuário final.

## Servidor

- `POST /scan-food` body `{ imageBase64, mimeType? }` (limite 8 MB, timeout 30 s) → chama upstream com prompt de visão pedindo **JSON estrito** `{ foods: [{ name, portionGrams, confidence }] }` (response_format json quando suportado) → valida com zod → responde `{ foods }`. Falha upstream → 502 com mensagem neutra. **Stateless: foto não é armazenada nem logada.**
- `GET /health`. Guarda simples opcional `APP_TOKEN` (header `x-leve-app`) contra abuso.
- Testes (vitest): parser tolerante (JSON puro, cercas de markdown, campos fora de faixa) e rota via `fastify.inject` com upstream fake (DI).
- Dockerfile + docker-compose + `.env.example`. Deploy = ação do dono (VPS/Cloud Run etc.).

## App

- `RemoteVisionProvider` implementa o `VisionProvider` (F0): foto → base64 (expo-file-system) → proxy → `FoodRecognition` (interface ganha `portionGrams?` nos candidatos). `getVisionProvider()` devolve o remoto quando `EXPO_PUBLIC_SCAN_URL` existe; senão o Unconfigured (UI esconde o scan).
- Fluxo na Refeição: botão **Escanear** (expo-image-picker: câmera ou galeria) → "Analisando…" → lista de candidatos com % de confiança → seleção tenta casar com a **TACO** (macros reais na porção estimada, editável); sem match → pré-preenche manual. Registro com `origin: 'scan'`. **Fallback manual sempre visível**; erro de rede → mensagem neutra + manual.
- Privacidade: primeira função com rede, opt-in por foto; PRIVACY.md atualizado (foto enviada só ao usar o scan, não armazenada).

## Fora de escopo

Contas/auth de usuário (F5), histórico de fotos, múltiplos alimentos por foto no v1 (usa candidatos da resposta; refino futuro), rate limit robusto.
