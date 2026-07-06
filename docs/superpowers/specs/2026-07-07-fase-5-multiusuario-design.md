# Design — FASE 5: Camada pública / multiusuário

Data: 2026-07-07 · Status: aprovado. Decisões do dono: e-mail/senha agora (social na F6); backup E2E (snapshot).

## Servidor (`server/` + PostgreSQL + Prisma)

- **Modelos**: `User` (uuid, email único, passwordHash scrypt, provider 'email' + providerId nulo — pronto p/ Apple/Google), `RefreshToken` (hash sha256 do token, expiração 30d, revogação/rotação), `Consent` (userId, kind ∈ {terms, backup}, grantedAt/revokedAt — granular LGPD), `Backup` (1 por usuário: blob base64 **cifrado no cliente**, size, updatedAt; servidor não tem a chave).
- **Rotas**: `POST /auth/register` (exige consent terms), `POST /auth/login`, `POST /auth/refresh` (rotação), `POST /auth/logout`; `GET /me`; `POST /consents`; `PUT/GET /backup` (limite 25 MB); `DELETE /account` (confirma senha; apaga usuário+tokens+consents+backup — direito de exclusão). JWT HS256 15 min (`JWT_SECRET` env).
- **Arquitetura testável**: interface `Store` com `MemoryStore` (testes vitest, sem banco) e `PrismaStore` (produção). `DATABASE_URL` ausente → servidor sobe só com o scan (deploy gradual).
- docker-compose ganha serviço `postgres:16` + `prisma migrate deploy` no start.

## App

- **Export/import local** (`features/backup/exportData.ts`): JSON versionado com todos os registros do usuário (TACO fica de fora — re-seed). `wipeAllData` apaga tabelas do usuário (onboarding volta pelo gate existente).
- **Cripto E2E** (`features/backup/crypto.ts`): chave = scrypt(senha, salt=email, N=2¹⁵) → AES-256-GCM (`@noble/hashes` + `@noble/ciphers`, nonce via expo-crypto). Chave derivada no login e guardada só no SecureStore. Senha esquecida ⇒ backup irrecuperável (aviso na UI); dados locais intactos.
- **Conta** (`/conta`, opt-in): criar conta/entrar com checkboxes de consentimento (termos obrigatório; backup opcional); logado: fazer backup agora, restaurar (troca de aparelho: baixa → decifra → importa), sair, excluir conta (confirmação dupla). Tokens/chave no expo-secure-store. Base URL: `EXPO_PUBLIC_API_URL` (fallback `EXPO_PUBLIC_SCAN_URL`).
- **Direitos LGPD ativos no Perfil**: Exportar meus dados (JSON via expo-sharing — funciona sem conta) e Excluir meus dados (confirmação dupla; local + servidor se logado).
- Sem conta = app segue 100% local como hoje.

## Fora de escopo

Sync incremental multi-aparelho, login social (F6), verificação de e-mail/reset de senha (exige provedor de e-mail — F6, ação do dono), painel admin.
