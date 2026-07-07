# Design — FASE 7: Saúde completa (métricas, insights, ciclo, remédios)

Data: 2026-07-07 · Status: aprovado (ordem 7a→7b→7c→7d; observações no app + push opcional)

## 7a — Métricas ampliadas

- Tabela genérica `health_metrics` (type, value, unit, origin, loggedAt). Tipos: sleep_hours, heart_rate_resting, heart_rate_avg, spo2, respiratory_rate, active_calories, exercise_minutes, body_fat_pct, body_water_kg, lean_mass_kg, bone_mass_kg, skeletal_muscle_kg, muscle_mass_kg, visceral_fat, subcutaneous_fat_pct, protein_pct, metabolic_age.
- `HealthProvider.readMetrics(since)` novo: Health Connect lê SleepSession→horas/dia, RestingHeartRate/HeartRate→médias diárias, OxygenSaturation, RespiratoryRate, BodyFat, BodyWaterMass, BoneMass, LeanBodyMass, ActiveCaloriesBurned, ExerciseSession→min/dia. HealthKit equivalentes (sono iOS v1 aproximado; não testável sem Mac). **Métricas proprietárias de balança (visceral, subcutânea, músculo esquelético, proteína, idade metabólica) não trafegam pelas plataformas → tela de entrada manual "Composição corporal"** (/log/corpo, campos opcionais).
- **Sync automático (pedido do dono)**: com a saúde conectada, peso + métricas são importados automaticamente ao focar o Hoje (throttle de 1 h via settings `lastHealthSyncAt`); balança que publica no app de saúde atualiza o Leve sozinha. "Importar agora" vira atalho manual; entrada manual (/log/corpo) é só fallback para métricas que a plataforma não repassa. Dedup type+loggedAt+origem. Progresso ganha seção "Corpo e saúde" (últimos valores + gráfico por métrica selecionável).

## 7b — Insights (observações informativas; nunca diagnóstico)

- Funções puras (`features/insights/`): janelas 14d vs 14d anteriores / 7d. Regras: recomposição (peso↑ + gordura↓ + músculo↑ = contexto positivo; peso↑ + gordura↑ + músculo/água↓ = atenção), sono médio <6h (ref. pública 7–9h), FC repouso +10% vs mês, ingestão de água <60% da meta em 5+ dias/7. Texto neutro terminando em "informativo — converse com seu médico" quando 'atenção'.
- Card "Observações" no Hoje. Push: toggle no Perfil agenda lembrete diário neutro ("Suas observações do dia estão no Leve") — análise em background real fica para quando houver push server-side.

## 7c — Ciclo menstrual

- `profile.sex` ('feminino'|'masculino'|'nao_informar', default null → perguntado no Perfil). Se feminino: item "Ciclo" no Registrar → registrar início/fim de menstruação + fluxo (leve/moderado/intenso); tabela `period_logs` (startedAt, endedAt?, flow?). Previsão informativa: média dos últimos ciclos → próxima data estimada (mín. 2 ciclos; rótulo "estimativa"). Card no Hoje (dia do ciclo/previsão) quando aplicável.

## 7d — Controle de remédios

- Tabelas `medications` (name, doseText, times 'HH:MM,HH:MM', active) e `med_intakes` (medicationId, scheduledFor, takenAt?). Tela "Meus remédios" (CRUD + lembretes DAILY por horário, ids `med-<id>-<n>`); Hoje: card "Remédios de hoje x/y" → marcar tomado; adesão (últimos 7 dias) no Progresso. Apoio de memória — sem qualquer conselho de dose (princípios de sempre).

## Banco

Migration 0002 única: `health_metrics`, `profile.sex`, `period_logs`, `medications`, `med_intakes`.

## Fora de escopo

Apneia como dado bruto (plataformas não exportam; aproximamos por FR/SpO₂ do sono), análise em background/push server-side, exportação de ciclo para HealthKit.
