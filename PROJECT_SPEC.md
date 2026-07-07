# Leve — Especificação do produto

App de saúde e acompanhamento de tratamento GLP-1 (multiplataforma).

> AVISO DE ESCOPO: este é um app de SAÚDE que lida com dados sensíveis e
> medicação de prescrição. Conformidade (LGPD/GDPR), privacidade e design
> responsável NÃO são opcionais — são estruturais. O app REGISTRA e ORGANIZA;
> NUNCA aconselha dose ou substitui orientação médica.

---

## Contexto e objetivo

Construa um **app multiplataforma (iOS + Android) de acompanhamento de saúde**
para pessoas em tratamento com GLP-1 (semaglutida, tirzepatida e afins),
inspirado na categoria de apps como Glowise/Shotsy — porém com **identidade,
nome e design próprios** (NÃO clonar marca, nome ou identidade visual de
nenhum app existente).

Funcionalidades centrais:
- Registro de **ingestão de água**, **alimentação/calorias**, **doses de
  medicação GLP-1** (injeções e pílulas), **peso** e medidas.
- **Scan de comida por IA** (foto → identificação + estimativa nutricional).
- **Sincronização com Apple Saúde (HealthKit) e Samsung Health / Health
  Connect** para importar peso, passos, e outros dados.
- Lembretes, gráficos de progresso, histórico, registro de sintomas/efeitos
  colaterais, e visualização de níveis estimados de medicação (baseada em dados
  farmacocinéticos públicos — apenas informativo).

Diferencial BR: usar base nutricional brasileira (ex.: TACO/Unicamp) além de
bases internacionais, para dados de alimentos locais precisos.

---

## Stack técnica (definida)

- **App**: React Native (com Expo onde possível; bare workflow se as libs de
  saúde exigirem) OU Flutter — avaliar e recomendar; padrão sugerido:
  **React Native + TypeScript**. Justificar a escolha.
- **Saúde**:
  - iOS: HealthKit via lib (ex.: `react-native-health` ou equivalente atual).
  - Android/Samsung: **Health Connect** via lib (ex.:
    `react-native-health-connect`). Samsung Health alimenta o Health Connect.
  - Abstrair ambos atrás de uma interface única `HealthProvider` no app, para
    o resto do código não saber qual plataforma está por baixo.
- **Backend** (para a camada pública/multiusuário): Node.js + TypeScript +
  Fastify + PostgreSQL + Prisma. Só entra na fase pública.
- **Auth**: JWT + refresh; considerar login social (Apple/Google) exigido pelas
  lojas.
- **Scan de comida (IA)**: módulo isolado que chama um serviço de visão
  (plugável — o dono tem um "AI Hub" próprio; estruturar para apontar para ele
  ou para uma API de visão externa) + base nutricional (TACO + internacional).
- **Deploy backend**: Docker + docker-compose.

---

## Princípios de design responsável (obrigatórios em todo o app)

1. **Registrar, não aconselhar.** O app nunca recomenda dose, titulação, ou
   conduta clínica. Cálculos de "nível estimado de medicação" são claramente
   rotulados como informativos e baseados em dados públicos, com disclaimer.
2. **Disclaimer médico visível** no onboarding e nas telas de medicação:
   "Ferramenta de registro e organização; não substitui orientação médica.
   Decisões sobre dose e tratamento são do seu médico."
3. **Conservador em lembretes de medicação**: deixar claro que o app é um apoio
   de memória, não uma autoridade clínica.
4. **Sem alarmismo e sem promessas** de resultado de perda de peso.

---

## Privacidade e conformidade (estrutural, não remendo)

- **LGPD (Brasil)**: dados de saúde são dados pessoais sensíveis. Exige base
  legal e **consentimento explícito e granular** (separado por finalidade),
  política de privacidade clara, direito de acesso/exclusão dos dados.
- **Minimização**: coletar só o necessário. Dados de saúde idealmente
  **criptografados em repouso**; em trânsito sempre TLS.
- **Preferência por local-first**: onde possível, dados sensíveis ficam no
  aparelho; a sincronização com backend é opt-in e criptografada.
- **Direitos do titular**: telas para exportar todos os seus dados e para
  excluir a conta e os dados permanentemente.
- **Regras das lojas**: cumprir políticas de saúde de Apple App Store e Google
  Play (disclaimers, uso de dados de saúde, permissões justificadas). Uso de
  dados do HealthKit/Health Connect NÃO pode ser usado para publicidade.
- Gerar um **PRIVACY.md** e um rascunho de política de privacidade.

---

## Faseamento (crítico — seguir na ordem)

**FASE 0 — Fundação do app + identidade**
Projeto React Native + TypeScript, navegação, design system próprio (nome,
paleta, logo, ícone — identidade original, NÃO copiar Glowise). Telas base e
armazenamento local (ex.: SQLite/WatermelonDB/MMKV).

**FASE 1 — Núcleo de registro (LOCAL, pessoal)**
Funciona 100% offline/local, sem backend ainda:
- Registro de água, peso, doses de GLP-1 (injeção/pílula, com histórico e
  rodízio de local de aplicação), sintomas/efeitos colaterais.
- Registro manual de refeições e cálculo de calorias/macros usando base
  nutricional (integrar TACO + uma base internacional).
- Gráficos de progresso (peso, doses, água, calorias) e lembretes locais.

**FASE 2 — Integração com saúde**
Interface `HealthProvider` unificada. Implementar HealthKit (iOS) e Health
Connect (Android/Samsung): importar peso, passos, e dados relevantes; opcional
escrever de volta (ex.: registrar peso no Apple Saúde). Pedir permissões com
justificativa clara.

**FASE 3 — Scan de comida por IA**
Módulo isolado: foto → serviço de visão (apontável para o AI Hub do dono ou API
externa) → identificação do alimento → estimativa nutricional cruzando com a
base de alimentos. Fallback manual sempre disponível. Tratar incerteza (mostrar
confiança, permitir correção).

**FASE 4 — Visualização de nível de medicação**
Curvas de nível estimado por farmacocinética pública (semaglutida,
tirzepatida). Claramente informativo, com disclaimer. Não prescritivo.

**FASE 5 — Camada pública / multiusuário**
SÓ AGORA entra o backend: contas, login (incl. Apple/Google), sincronização
opt-in e criptografada, backup. Implementar consentimento LGPD granular,
exportação e exclusão de dados. Painel mínimo de suporte/admin se necessário.

**FASE 6 — Publicação**
Preparar para App Store e Google Play: disclaimers, política de privacidade,
justificativas de permissão de saúde, screenshots, revisão de conformidade.
Conta de desenvolvedor Apple (US$99/ano) e Google Play (US$25 única vez) são
pré-requisitos do dono.

---

## Modelo de dados (inicial, local; espelhar no backend na Fase 5)

- **User/Profile** (local na fase pessoal): metas, altura, medicação atual.
- **WaterLog**: timestamp, quantidade.
- **FoodLog**: timestamp, alimento, porção, calorias, macros, origem (manual/
  scan), foto opcional.
- **DoseLog**: medicação, dose, via (injeção/pílula), local de aplicação,
  timestamp, próxima dose.
- **SymptomLog**: tipo, intensidade, timestamp.
- **WeightLog**: peso, origem (manual/HealthKit/HealthConnect), timestamp.
- **FoodItem** (base nutricional): nome, porção-referência, calorias, macros,
  fonte (TACO/internacional).

---

## Diretrizes de desenvolvimento

1. Trabalhar em fases, na ordem definida acima.
2. Abstrair integrações de plataforma (saúde, visão computacional) atrás de
   interfaces, para trocar implementações sem reescrever o núcleo.
3. Tratar o app como **local-first**: plenamente útil offline e pessoal antes
   de existir qualquer backend.
4. Aplicar os princípios de design responsável e privacidade em toda tela
   relevante desde o início.
5. Não copiar nome, marca ou identidade visual de apps existentes.
6. Registrar claramente o que exige ação fora do código (contas de loja,
   política de privacidade revisada por advogado, etc.).
