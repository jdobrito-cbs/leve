# Privacidade — Leve (rascunho, FASES 0–5)

## Conta e backup (FASE 5)

- Criar conta é **opcional**: sem conta, o app é 100% local, como sempre.
- Consentimento **granular** no cadastro: termos (obrigatório) e backup (opcional, revogável), registrados com data no servidor.
- O backup é **criptografado de ponta a ponta no aparelho** (chave derivada da sua senha) — o servidor armazena um blob ilegível e **não tem como decifrá-lo**. Senha esquecida = backup irrecuperável (os dados locais permanecem).
- **Direito de acesso**: "Exportar meus dados" gera um arquivo JSON com todos os registros, mesmo sem conta.
- **Direito de exclusão**: "Excluir meus dados" apaga tudo do aparelho; "Excluir conta e backup" apaga permanentemente a conta e o blob no servidor (confirmação com senha).

## Scan de comida por IA (FASE 3)

- É a única função do app que usa internet, e é **opt-in por foto**: nada é enviado sem você tocar em Escanear.
- A foto vai com criptografia (TLS) para o servidor do Leve, que a repassa ao serviço de IA apenas para identificar os alimentos; o servidor é **stateless** — a foto **não é armazenada nem registrada em logs**.
- Nenhuma chave ou configuração técnica fica no aparelho; o resultado (nomes de alimentos, porção estimada, confiança) só é gravado localmente se você confirmar o registro.

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
