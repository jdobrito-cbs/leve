# Checklist de publicação — Leve

Ordem escolhida: **Apple App Store primeiro**, depois **Google Play** quando o Android estiver concretizado.
Identificador único das duas lojas: `app.leve.mobile` (não muda depois do 1º envio). Domínio: **levemobile.com.br**.

Legenda: [x] já pronto no código · [ ] ação sua (fora do código) · ⚙️ eu configuro quando você me passar os dados.

---

## FASE 0 — Contas e questões legais (fazer uma vez)

- [ ] **Definir o "vendedor" (entidade legal)**. A conta é de uma entidade só. Duas opções:
  - **Indivíduo** (mais rápido, sai hoje): aparece o nome de uma pessoa como vendedor. O copyright no app continua "Jorge Brito e Jorge Manoel Reis Brito".
  - **Organização/empresa**: exige número **D-U-N-S** (gratuito, leva 1–2 semanas) e aparece o nome da empresa. Escolha se pretende faturar como PJ.
- [ ] **Conta Apple Developer** — US$ 99/ano — developer.apple.com/programs (aprovação: horas a 2 dias).
- [ ] **Dados bancários e fiscais (Apple)** em App Store Connect → Business, para receber os repasses (precisa de conta bancária + dados fiscais BR).
- [ ] **Conta Google Play Console** — US$ 25 (uma vez) — só quando for para o Android.
- [ ] **Advogado revisa** os 3 documentos legais (aviso médico, termos, política) antes do envio — base já pronta em `mobile/src/i18n/legal-pt-BR.ts`, incluindo a nota de que as traduções são cortesia.

---

## FASE 1 — Servidor e configuração comercial (antes de qualquer envio)

- [ ] **Publicar o servidor com HTTPS** no domínio: apontar DNS de `www.levemobile.com.br` para a hospedagem, `docker compose up -d --build`, certificado (Caddy/Nginx/painel da hospedagem). Sem isto, scan por foto, busca de calorias e validação de chave ficam inativos.
- [ ] **Gerar segredos fortes** no `.env` do servidor: `JWT_SECRET` (mín. 32 — `openssl rand -hex 32`) e `ADMIN_TOKEN` (mín. 16 — `openssl rand -hex 24`). O servidor recusa subir com segredos curtos.
- [ ] **Conta RevenueCat** (revenuecat.com) — grátis até ~US$ 2,5 mil/mês de receita. É a camada que conversa com as compras da Apple/Google; ele **não** cobra, quem cobra é a loja.
- ⚙️ **Colar as chaves públicas do RevenueCat** no build: `EXPO_PUBLIC_REVENUECAT_IOS_KEY` e `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (em `mobile/eas.json` → `build.production.env`). Me passa as chaves que eu configuro.
- [ ] **Confirmar a resposta de "export compliance"**: hoje o app declara `ITSAppUsesNonExemptEncryption: false`. Com o backup cifrado (AES-256-GCM) adicionado, confirme na Apple que só usa **criptografia padrão** (isenta) — geralmente continua `false`, mas vale marcar a autoavaliação anual se pedirem. ⚙️ Se precisar mudar a flag, eu ajusto.

---

## FASE 2 — App Store (Apple) — primeiro alvo

### 2a. Registro do app
- [ ] App Store Connect → Apps → **novo app**: nome "Leve", idioma primário Português (Brasil), bundle `app.leve.mobile`, SKU livre (ex.: `leve-001`).
- [ ] **URLs obrigatórias**: suporte e política de privacidade → usar `https://www.levemobile.com.br` (a landing) e `https://www.levemobile.com.br` + rota da política quando publicá-la, ou a tela do app.

### 2b. Assinaturas (Leve Premium)
- [ ] App Store Connect → Assinaturas → **grupo "Leve Premium"** com 2 produtos auto-renováveis:
  - `leve.premium.monthly` — mensal (R$ 11,90)
  - `leve.premium.annual` — anual (R$ 106,90)
- [ ] Descrição e "display name" de cada assinatura + captura de tela da tela de assinatura (a Apple exige).
- [ ] **App Store Small Business Program** — inscrever-se baixa a comissão de 30% → **15%** (não é automático) — developer.apple.com/app-store/small-business-program.
- ⚙️ **RevenueCat**: criar o entitlement `premium`, vincular os 2 produtos e montar a offering padrão (pacotes MONTHLY e ANNUAL). Eu monto quando a conta existir.

### 2c. Privacidade e saúde (parte mais sensível)
- [ ] **App Privacy** (rótulos de privacidade): declarar que coleta dados de saúde e de conta **guardados no aparelho**, backup **cifrado ponta a ponta**, **nada** usado para rastreamento/publicidade. Base: a política em `legal-pt-BR.ts`.
- [ ] **HealthKit**: confirmar no formulário que os dados de saúde **não** vão para publicidade nem para terceiros (verdade no app). A justificativa de uso já está no `NSHealthShareUsageDescription`.
- [x] **Exclusão de conta dentro do app** (exigência 5.1.1(v)) — já pronto: Perfil → Conta e privacidade → Excluir meus dados (+ `/account` no servidor).
- [x] **Sign in with Apple** (exigido porque há login Google) — já implementado.
- [x] Permissões com justificativa (saúde, câmera, fotos, movimento, notificações) — já nos `Info.plist`/`app.json`.

### 2d. Risco de revisão — app de saúde/GLP-1 (ler com atenção)
Apps de emagrecimento e ligados a GLP-1 recebem **escrutínio extra**. O que nos protege (e já está no app):
- [x] Enquadramento "**registra e organiza, não aconselha dose**" — nenhum texto sugere dose, ajuste ou promessa de emagrecimento.
- [x] Aviso médico no onboarding e nas telas de medicação; estimativas rotuladas como informativas.
- [ ] **Notas para o revisor** (App Review Information) — escrever explicando: "app de registro pessoal para acompanhamento de tratamento sob orientação médica; não fornece diagnóstico nem prescrição; a análise de foto é estimativa informativa". ⚙️ Eu redijo o texto quando você for enviar.
- [ ] **Classificação etária**: responder o questionário com honestidade (referência a tratamento médico → provável 12+). Não exagerar nem minimizar.

### 2e. Materiais da loja
- [ ] **Screenshots** (iPhone 6.7" e 6.5" obrigatórios) — capturar no build de produção: Hoje, Registrar refeição (TACO/scan), Progresso (Dados corporais), Relatório PDF, Perfil. Mín. 3–4 por tamanho.
- [ ] **Ícone** 1024×1024 (sem transparência) — exportar de `assets/images/icon.png`.
- [ ] Textos da listagem (nome, subtítulo, descrição, palavras-chave) — base em `store/listagem.md`; posso atualizar para os 12 idiomas se você quiser publicar localizado.

### 2f. Build, teste e envio
- ⚙️ **Build de produção**: `cd mobile && npx eas-cli build --platform ios --profile production` (com as chaves do RevenueCat no env). Eu disparo.
- [ ] **TestFlight**: instalar o build, testar **compra sandbox** (criar testador sandbox em App Store Connect → Users), scan, saúde, relatório, exclusão de conta.
- [ ] **Conta/chave de teste para o revisor**: como o Premium é bloqueado, gerar uma **chave de parceiro** no painel (`/painel`) e colocar nas notas do revisor para ele testar tudo. ⚙️ Eu explico o passo.
- ⚙️ **Enviar para revisão**: `eas submit -p ios` (configuro `submit.production` no eas.json com Apple ID + ASC App ID) ou pelo Transporter.
- [ ] Acompanhar a revisão (1–3 dias em média); responder rápido se pedirem ajuste.

---

## FASE 3 — Google Play (depois, quando o Android estiver pronto)

Reaproveita tudo da Apple; só muda o específico do Android.

- [ ] **Play Console** — US$ 25 (uma vez).
- [ ] **Regra de testadores**: contas de desenvolvedor **pessoais** criadas depois de nov/2023 precisam de **12–20 testadores por 14 dias** numa faixa de teste fechada antes de publicar em produção. Contas de organização não. Planeje esse prazo.
- [ ] **Data safety** (equivalente ao App Privacy) — mesma verdade: dados no aparelho, backup E2E, sem publicidade.
- [ ] **Health Connect**: preencher a **declaração de acesso a dados de saúde** do Google (exige descrever o uso). A permissão de **leitura em segundo plano** (`READ_HEALTH_DATA_IN_BACKGROUND`, já no manifesto) e a **tarefa em segundo plano** precisam de justificativa no formulário.
- [ ] **Assinaturas**: Play Console → Produtos → Assinaturas com os **mesmos ids** (`leve.premium.monthly`, `leve.premium.annual`) e preços. Google já cobra 15% desde o 1º real (sem inscrição).
- ⚙️ **RevenueCat Android**: vincular os produtos do Google ao mesmo entitlement `premium`.
- ⚙️ **Build AAB**: `npx eas-cli build --platform android --profile production` (AAB para a Play Store) + `eas submit -p android` (com a conta de serviço do Google).
- [ ] **Ícone** 512×512 + screenshots (celular; opcional tablet) + textos da listagem.
- [ ] Testar compra sandbox no Android antes de promover para produção.

---

## Já resolvido no código (não precisa fazer nada)

- [x] Pagamento pelas lojas via RevenueCat (`react-native-purchases`) — só faltam as chaves e os produtos.
- [x] Caminho **sem loja/sem comissão**: chaves de parceiro geridas no servidor (`/painel`) para cortesias e parcerias.
- [x] Login Apple e Google funcionais; Sign in with Apple presente.
- [x] Exclusão e exportação de dados (LGPD + exigência das lojas).
- [x] Consentimento granular no cadastro; disclaimers em todo lugar; sem promessa de emagrecimento.
- [x] 12 idiomas + unidades métrico/imperial; relatório e documentos legais traduzidos.
- [x] Segurança do servidor endurecida (rate limit, headers, anti-XSS, segredos fortes) — ver `[[seguranca-servidor]]`.

## Fora do escopo de código (camada de hospedagem, quando publicar o servidor)
- [ ] WAF / proteção de borda / anti-DDoS no provedor.
- [ ] Backup do banco (se usar PostgreSQL para contas/backup na nuvem).
- [ ] Guardar com segurança o `ADMIN_TOKEN` e a chave de IA — nunca no repositório.
