# Design — FASE 1: Núcleo de registro (local, pessoal)

Data: 2026-07-07
Status: aprovado pelo dono (escopo: TACO offline; lembretes de dose + água)
Referência: [PROJECT_SPEC.md](../../../PROJECT_SPEC.md) · Fundação: [FASE 0](2026-07-06-fase-0-fundacao-design.md)

## Decisões

| Decisão | Escolha | Justificativa |
|---|---|---|
| Base nutricional | Somente TACO na F1, embutida | Local-first: 597 alimentos brasileiros, busca offline instantânea. Fonte: CSVs normalizados de github.com/raulfdm/taco-api (`references/csv/food.csv` + `nutrients.csv` + `categories.csv`, dados públicos NEPA/Unicamp), convertidos em JSON embutido (~60 KB) por script de build committado. Base internacional fica para fase futura — `food_items.source` já distingue. |
| Lembretes | Dose + água, desligados por padrão | expo-notifications (locais, sem rede). Texto neutro de apoio à memória. Identificadores fixos ('dose-reminder', 'water-N') para cancelar/reagendar sem guardar estado extra. |
| Gráficos | react-native-gifted-charts | Puro JS + react-native-svg (já instalado), leve, customizável com nossos tokens. Se incompatível com RN 0.86, fallback: gráficos SVG próprios (linha e barras simples). |
| Fronteira de dia | Faixa local convertida a UTC | Timestamps continuam ISO UTC; consultas "do dia" usam helper `dayRangeUtc(date)` → BETWEEN. Sem coluna nova. |
| Configurações | Tabela `settings` (key/value) | Lembretes e flags não-sensíveis; testável com o mesmo harness dos repos. |
| Metas | Usuário define; app não sugere | Meta de água (padrão 2000 ml), meta de calorias opcional SEM cálculo/sugestão automática — design responsável: metas calóricas são do usuário/médico. |

## Banco (migration 0001)

- `profile`: + `water_goal_ml` (real, not null, default 2000), + `calorie_goal_kcal` (real, nullable).
- `food_items`: + `name_normalized` (text, para busca sem acento), + `category` (text).
- Nova tabela `settings` (`key` text PK, `value` text).
- Seed TACO na inicialização (após migrations): se `food_items` com source 'taco' estiver vazio, insere os 597 itens (nome, categoria, kcal/proteína/carbo/gordura por 100 g, `referencePortion` = "100 g").

## Repositórios (padrão do profileRepo: funções puras recebendo `AppDb`, testes com better-sqlite3)

- `waterRepo`: addWater, totalForDay, dailyTotals(últimos N dias).
- `weightRepo`: addWeight, latest, listSince (para gráfico 30/90 dias).
- `doseRepo`: addDose, latest (com nextDoseAt), list, lastInjectionSite.
- `symptomRepo`: addSymptom, listForDay, list.
- `foodLogRepo`: addFoodLog, listForDay, kcalForDay, dailyKcal(últimos N dias).
- `foodItemsRepo`: searchFoods(query) — LIKE sobre `name_normalized` (função `normalizeText` remove acentos/caixa), limite 25.
- `settingsRepo`: getSetting/setSetting (JSON string).
- Rodízio de injeção: `suggestNextSite(lastSite)` — ciclo fixo [abdômen E, abdômen D, coxa E, coxa D, braço E, braço D]; função pura com teste. UI rotula como "sugestão de rodízio (apoio de memória)".

## Telas (rotas stack modais fora das abas: `app/log/agua|refeicao|dose|peso|sintoma.tsx`)

Cada card do hub Registrar navega para sua tela; após salvar, volta e o dashboard reflete.

- **Água**: botões rápidos 200/300/500 ml + campo livre; total do dia vs meta.
- **Peso**: kg com decimal; mostra último registro e diferença (número neutro).
- **Dose**: medicação (semaglutida/tirzepatida/liraglutida/outra), dose mg, via (injeção/pílula); se injeção → grade de 6 locais com último usado marcado e próximo sugerido; data opcional da próxima dose (reagenda lembrete se ativado).
- **Sintoma**: chips (náusea, vômito, constipação, diarreia, fadiga, tontura, azia, outro) + intensidade 1–5.
- **Refeição**: busca TACO offline → seleciona alimento → porção em g → kcal/macros proporcionais; OU aba manual (nome + kcal, macros opcionais). Lista do dia com total.

## Hoje (dashboard vivo)

Hero azul mantido; anel = **água hoje vs meta**; grade de cards (IconChip): Calorias hoje, Próxima dose (ou última), Último peso, Sintomas hoje — cada card navega para o registro correspondente. Recarrega ao focar a aba (`useFocusEffect`).

## Progresso

- Peso: linha (30/90 dias, seletor).
- Água: barras 7 dias vs meta.
- Calorias: barras 7 dias.
- Doses: lista histórica (medicação, mg, via, local, data).
- Empty states com o padrão da F0 quando não houver dados.

## Perfil

- Edição: nome, altura, medicação atual, meta de peso, meta de água, meta de calorias (opcional, sem sugestão).
- Lembretes: toggle dose; toggle água + horários (padrão 09:00/13:00/17:00, editáveis); pedido de permissão com justificativa; textos neutros ("apoio de memória").
- Mantém DisclaimerBanner e seção Privacidade (exportar/excluir continuam "em breve" — F5).

## Erros e casos-limite

- Valores inválidos (≤0, não numérico): botão salvar desabilitado + mensagem inline.
- Busca TACO sem resultado: estado vazio com atalho para entrada manual.
- Permissão de notificação negada: toggle volta a desligado com explicação, sem loop de prompts.
- Seed TACO roda uma vez; falha de seed não bloqueia o app (registros manuais seguem funcionando; busca mostra vazio com aviso).

## Testes

Repos e helpers (better-sqlite3 em memória): totais por dia, faixas, busca normalizada, rodízio, settings. Lógica de lembretes com expo-notifications mockado. Telas com hooks/DB mockados (padrão da F0). Meta: cada tela salva → repo chamado com payload correto.

## Fora de escopo

HealthKit/Health Connect (F2), scan IA (F3), farmacocinética (F4), backend/exportação/exclusão (F5), base internacional.
