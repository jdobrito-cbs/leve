# Privacidade — Leve (rascunho, FASES 0–2)

## Integrações de saúde (FASE 2)

- A conexão com Apple Saúde (HealthKit) e Health Connect é **opt-in**: nada é lido sem você tocar em "Conectar" e autorizar na tela do sistema.
- Somente **leitura** de peso e passos; a importação acontece apenas quando você toca em "Importar" (sem sincronização em segundo plano).
- Dados importados ficam **apenas no seu aparelho**, junto dos demais registros locais.
- Dados de HealthKit/Health Connect **jamais** são usados para publicidade ou compartilhados — conforme as políticas da Apple e do Google.
- Você pode desconectar no Perfil a qualquer momento e revogar as permissões no app de saúde do sistema.

- O Leve é **local-first**: nesta fase, TODOS os dados ficam no aparelho (SQLite no sandbox do app). Nenhum dado sai do dispositivo — o app não faz nenhuma chamada de rede.
- Dados tratados (localmente): perfil (metas, altura, medicação), água, refeições, doses de medicação, sintomas, peso.
- Criptografia em repouso: o sandbox do app é protegido pela criptografia do sistema (iOS Data Protection / Android File-Based Encryption) em aparelhos com bloqueio de tela configurado. SQLCipher será avaliado se exigido por revisão de conformidade.
- Direitos do titular (LGPD): exportação e exclusão de dados terão telas dedicadas (as entradas já estão visíveis na aba Perfil, marcadas como "disponível em breve").
- Sem publicidade e sem uso de dados de saúde para marketing — dados de HealthKit/Health Connect (Fase 2) **jamais** serão usados para publicidade, conforme as políticas da Apple e do Google.
- Consentimento: o onboarding exige aceite explícito do disclaimer médico antes do uso; consentimentos granulares por finalidade (sync, integrações de saúde) serão adicionados quando essas funções existirem (Fases 2 e 5).
- Este documento é um rascunho técnico; a política de privacidade final deve ser **revisada por advogado** antes da publicação nas lojas (Fase 6).
