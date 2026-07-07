# Privacidade — Leve (rascunho)

## Princípios

- O Leve é **local-first**: os registros ficam no aparelho (banco local no sandbox do app). Nada sai do dispositivo sem uma ação explícita sua.
- Dados tratados localmente: perfil (metas, altura, sexo, medicação), água, refeições, doses de medicação, remédios e tomadas, sintomas, peso, ciclo menstrual e métricas de saúde (sono, frequência cardíaca, composição corporal etc.).
- Criptografia em repouso: o sandbox do app é protegido pela criptografia do sistema (iOS Data Protection / Android File-Based Encryption) em aparelhos com bloqueio de tela.
- Sem publicidade e sem uso de dados de saúde para marketing, conforme as políticas da Apple e do Google.
- O onboarding exige aceite explícito do aviso: o Leve registra e organiza; não substitui orientação médica.

## Conta e backup

- Criar conta é **opcional**: sem conta, o app é 100% local.
- Consentimento **granular** no cadastro: termos (obrigatório) e backup (opcional, revogável), registrados com data no servidor.
- O backup é **criptografado de ponta a ponta no aparelho** (chave derivada da sua senha) — o servidor armazena um blob ilegível e **não tem como decifrá-lo**. Senha esquecida = backup irrecuperável (os dados locais permanecem).
- **Direito de acesso**: "Exportar meus dados" gera um arquivo com todos os registros, mesmo sem conta.
- **Direito de exclusão**: "Excluir meus dados" apaga tudo do aparelho; "Excluir conta e backup" apaga permanentemente a conta e o backup no servidor (confirmação com senha).

## Identificação de alimentos por foto

- Recurso **opt-in por foto**: nada é enviado sem você tocar em Escanear.
- A foto vai com criptografia (TLS) para o servidor do Leve, que a repassa ao serviço de visão apenas para identificar os alimentos; o servidor é **stateless** — a foto **não é armazenada nem registrada em logs**.
- O resultado (nomes de alimentos, porção estimada, confiança) só é gravado localmente se você confirmar o registro.

## Integrações de saúde

- A conexão com Apple Saúde (HealthKit) e Health Connect é **opt-in**: nada é lido sem você tocar em "Conectar" e autorizar na tela do sistema.
- Somente **leitura** (peso, passos, sono, frequência cardíaca, composição corporal e afins). Com a conexão ativa, a importação roda ao abrir o app; você pode desconectar no Perfil a qualquer momento e revogar as permissões no app de saúde do sistema.
- Dados importados ficam **apenas no seu aparelho**, junto dos demais registros locais.
- Dados de HealthKit/Health Connect **jamais** são usados para publicidade ou compartilhados.

## Observações de saúde

- As "Observações" são calculadas **no aparelho**, a partir dos seus próprios registros, e são informativas — não constituem diagnóstico nem orientação médica.

---

Este documento é um rascunho técnico; a política de privacidade final deve ser **revisada por advogado** antes da publicação nas lojas.
