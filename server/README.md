# leve-server — IA de comida + painel de parceiros

Serviço que mantém a chave de IA **fora do app** e emite/revoga as chaves premium de parceiros. Stateless no scan: fotos não são armazenadas nem logadas.

**Domínio oficial (produção): https://www.levemobile.com.br** — o mesmo endereço serve o painel de parceiros (`/admin`), os serviços de IA (`/scan-food`, `/food-info`) e, futuramente, o site do Leve na raiz.

## Rodar (desenvolvimento)

```bash
cd server
npm install
cp .env.example .env   # preencha HUB_API_KEY (OpenRouter) e ADMIN_TOKEN
npm run dev
```

- Saúde: `http://localhost:3333/health`
- **Painel de parceiros: `http://localhost:3333/admin`** (produção: `https://www.levemobile.com.br/admin`) — informe o ADMIN_TOKEN, gere chaves com o nome do parceiro e revogue quando quiser. O código completo aparece só na criação.
- Sem banco de dados, as chaves ficam em `./data/partner-keys.json`. Com `DATABASE_URL` + `JWT_SECRET` (PostgreSQL), contas/backup ligam e as chaves migram para o banco (`npx prisma migrate deploy`).

Produção com Docker: `docker compose up -d --build`

Painel e validação atendem apps iOS e Android igualmente (chamadas HTTP padrão). Em produção, publique o servidor com **HTTPS** no domínio acima (apontar o DNS de `www.levemobile.com.br` para a hospedagem e emitir o certificado — Let's Encrypt/Caddy/Nginx ou o proxy da própria hospedagem) — os dois sistemas bloqueiam `http://` simples em apps das lojas; no teste local o endereço `http://SEU-IP:3333` funciona nos builds de desenvolvimento.

## API

- `POST /scan-food` → `{ "imageBase64": "...", "mimeType": "image/jpeg" }` → `{ "foods": [{ "name", "portionGrams", "confidence" }] }`. Se `APP_TOKEN` estiver definido, o app envia o header `x-leve-app`.
- `POST /food-info` → `{ "name": "alimento digitado" }` → `{ "found", "unit", "kcalPer100", "proteinG", "carbsG", "fatG", "fiberG" }` (consulta nutricional do alimento manual; mesmo header opcional).
- `POST /partner-keys/validate` → `{ "key": "LEVE-XXXX-XXXX-XXXX" }` → `{ "valid": true|false, "label"? }` (público; usado pelo app no resgate e na reverificação).
- `GET/POST /partner-keys`, `POST /partner-keys/:id/revoke` → gestão (exigem `Authorization: Bearer ADMIN_TOKEN`).

## App (mobile)

No `mobile/.env` (desenvolvimento) e nos `env` dos perfis do `mobile/eas.json` (builds):

```
EXPO_PUBLIC_LEVE_SERVER_URL=https://www.levemobile.com.br
# Teste local: EXPO_PUBLIC_LEVE_SERVER_URL=http://SEU-IP-LOCAL:3333
#EXPO_PUBLIC_SCAN_TOKEN=igual ao APP_TOKEN, se definido
```

Testes: `npm test`
