# leve-server — IA de comida + painel de parceiros

Serviço que mantém a chave de IA **fora do app** e emite/revoga as chaves premium de parceiros. Stateless no scan: fotos não são armazenadas nem logadas.

**Domínio oficial (produção): https://www.levemobile.com.br** — a raiz `/` serve a **landing do produto** (o que o Leve faz, para os usuários); o painel de parceiros fica em **`/painel`** (o `/admin` antigo redireciona); e os serviços de IA respondem em `/scan-food` e `/food-info`.

## Rodar (desenvolvimento)

```bash
cd server
npm install
cp .env.example .env   # preencha HUB_API_KEY (OpenRouter) e ADMIN_TOKEN
npm run dev
```

- Saúde: `http://localhost:3333/health`
- **Painel do dono: `http://localhost:3333/painel`** (produção: `https://levemobile.com.br/painel`) — login com **e-mail** e senha + **2FA obrigatório** (app autenticador). No **primeiro acesso**, cadastre o administrador master informando o ADMIN_TOKEN do servidor; depois é possível cadastrar outros administradores, gerar/revogar chaves de parceiro e desvincular a chave do aparelho. O código da chave aparece só na criação.
- As sessões e o segredo do 2FA derivam do **ADMIN_TOKEN**: girá-lo encerra as sessões e exige reconfigurar o 2FA. Ele é também a chave-mestra de recuperação (`POST /admin/recover`) e libera o cadastro inicial.
- Sem banco de dados, as chaves ficam em `./data/partner-keys.json` e os administradores em `./data/admins.json`. Com `DATABASE_URL` + `JWT_SECRET` (PostgreSQL), contas/backup ligam e tudo vai para o banco — aplique o schema com `npx prisma db push` após atualizar.

Produção com Docker: `docker compose up -d --build`

Produção no painel (WSRTA): `node scripts/build-install-zip.mjs` gera `deploy/leve-server.zip` (com `app.md` na raiz e `setup.sh`, que monta o `.env` com segredos únicos e mostra o ADMIN_TOKEN no log da instalação). O mesmo zip serve para instalar e atualizar — o `.env` do servidor é preservado nas atualizações.

Painel e validação atendem apps iOS e Android igualmente (chamadas HTTP padrão). Em produção, publique o servidor com **HTTPS** no domínio acima (apontar o DNS de `www.levemobile.com.br` para a hospedagem e emitir o certificado — Let's Encrypt/Caddy/Nginx ou o proxy da própria hospedagem) — os dois sistemas bloqueiam `http://` simples em apps das lojas; no teste local o endereço `http://SEU-IP:3333` funciona nos builds de desenvolvimento.

## API

- `POST /scan-food` → `{ "imageBase64": "...", "mimeType": "image/jpeg" }` → `{ "foods": [{ "name", "portionGrams", "confidence" }] }`. Se `APP_TOKEN` estiver definido, o app envia o header `x-leve-app`.
- `POST /food-info` → `{ "name": "alimento digitado" }` → `{ "found", "unit", "kcalPer100", "proteinG", "carbsG", "fatG", "fiberG" }` (consulta nutricional do alimento manual; mesmo header opcional).
- `POST /partner-keys/validate` → `{ "key": "LEVE-XXXX-XXXX-XXXX", "deviceId"? }` → `{ "valid": true|false, "label"?, "reason"? }` (público; com `deviceId`, prende a chave a 1 aparelho no primeiro resgate; `reason: "bound_elsewhere"` quando já está presa a outro).
- `GET/POST /partner-keys`, `POST /partner-keys/:id/revoke`, `POST /partner-keys/:id/unbind` → gestão (sessão do painel **ou** `Authorization: Bearer ADMIN_TOKEN`).
- Painel do dono (login + 2FA): `POST /admin/setup` (1ª vez), `/admin/login`, `/admin/logout`, `/admin/2fa/setup`, `/admin/2fa/confirm`, `GET /admin/me`, `GET /admin/list`, `POST /admin` (novo admin), `POST /admin/password` (própria), `POST /admin/:id/password`, `DELETE /admin/:id`, `POST /admin/:id/reset-2fa`, `POST /admin/recover` (chave-mestra).

## App (mobile)

No `mobile/.env` (desenvolvimento) e nos `env` dos perfis do `mobile/eas.json` (builds):

```
EXPO_PUBLIC_LEVE_SERVER_URL=https://www.levemobile.com.br
# Teste local: EXPO_PUBLIC_LEVE_SERVER_URL=http://SEU-IP-LOCAL:3333
#EXPO_PUBLIC_SCAN_TOKEN=igual ao APP_TOKEN, se definido
```

Testes: `npm test`
