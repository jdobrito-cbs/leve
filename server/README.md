# leve-server — proxy do scan de comida

Serviço mínimo que mantém a chave do AI Hub **fora do app**. Stateless: fotos não são armazenadas nem logadas.

## Rodar

```bash
cp .env.example .env   # preencha HUB_BASE_URL, HUB_API_KEY, HUB_MODEL
docker compose up -d --build
curl http://localhost:3333/health
```

## API

- `POST /scan-food` → `{ "imageBase64": "...", "mimeType": "image/jpeg" }` → `{ "foods": [{ "name", "portionGrams", "confidence" }] }`
- Se `APP_TOKEN` estiver definido, o app envia o header `x-leve-app`.

Desenvolvimento: `npm install && npm run dev` · Testes: `npm test`
