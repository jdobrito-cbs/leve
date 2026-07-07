# Checklist de publicação — Leve

## Pré-requisitos (fora do código)

- [ ] Conta Apple Developer (US$ 99/ano) — developer.apple.com
- [ ] Conta Google Play Console (US$ 25 único) — play.google.com/console
- [ ] Domínio para o bundle id `app.leve.mobile` (registrar leve.app ou ajustar o id antes do 1º envio — depois não muda)
- [ ] Servidor no ar (server/: `cp .env.example .env` + `docker compose up -d --build`) com HTTPS
- [ ] Política de privacidade revisada por advogado e publicada em URL pública (base: PRIVACY.md)

## Builds

- [ ] `cd mobile && npx eas-cli login`
- [ ] Android produção: `npx eas-cli build --platform android --profile production` (AAB para a Play Store)
- [ ] iOS produção: `npx eas-cli build --platform ios --profile production` (exige a conta Apple)
- [ ] Testar o build de produção em aparelho real antes de enviar

## Conformidade (estado atual)

- [x] Disclaimer médico obrigatório no onboarding e visível nas telas de medicação
- [x] Sem promessas de perda de peso em nenhum texto
- [x] Permissões com justificativa (saúde, câmera, fotos, notificações)
- [x] Dados de saúde nunca usados para publicidade
- [x] Exportação e exclusão de dados funcionais (LGPD)
- [x] Consentimento granular na criação de conta
- [x] Observações/insights rotulados como informativos, sem diagnóstico
- [ ] URL pública da política de privacidade preenchida nos formulários das lojas
- [ ] Formulário "Data safety" (Play) e "App Privacy" (App Store) preenchidos conforme PRIVACY.md

## Loja

- [ ] Screenshots (mín. 4): Hoje, Registrar refeição (TACO/scan), Progresso, Perfil — capturar no build de produção
- [ ] Textos de store/listagem.md nos formulários
- [ ] Ícone 512×512 (Play) — exportar de assets/images/icon.png
- [ ] Classificação etária: questionários das lojas (app de saúde, sem conteúdo sensível)

## Login social (pós-contas)

- [ ] Google: criar OAuth client no Google Cloud → implementar verificação de id_token no servidor (campo provider/providerId já existe no banco)
- [ ] Apple: ativar "Sign in with Apple" no portal Apple → mesmo fluxo
- [ ] Apple exige o botão da Apple se houver login Google no iOS
