# Design — FASE 4: Nível estimado de medicação (informativo)

Data: 2026-07-07 · Status: aprovado ("Aprovado, pode executar")

- **Modelo**: um compartimento, absorção e eliminação de 1ª ordem (equação de Bateman), por **superposição das doses registradas**. `ke = ln2/t½`; `ka` resolvido numericamente a partir do `tmax` (bisseção sobre `tmax = ln(ka/ke)/(ka−ke)`).
- **Parâmetros públicos** (literatura/bulas): semaglutida t½ 168 h / tmax 48 h; tirzepatida t½ 120 h / tmax 24 h; liraglutida t½ 13 h / tmax 10 h. Medicações fora da tabela → **sem curva** (mensagem explicando).
- **Exibição**: somente **nível relativo (%)** normalizado pelo pico da janela — nunca concentração absoluta. Janela: 30 dias passados + 7 futuros (projeção pela última agenda de doses registrada), passo de 6 h.
- **Onde**: seção no topo do Progresso com `DisclaimerBanner` + texto específico: estimativa matemática com dados populacionais públicos; não reflete nível real; não orienta decisões.
- **Proibido**: alertas/notificações ou qualquer texto sugerindo ação com base no nível.
- **Testes**: função pura — zero antes da 1ª dose; pico ≈ tmax; decaimento após meia-vida; superposição aumenta nível; normalização com máximo 1; medicação desconhecida → null.
- Fora de escopo: seleção de modelo por via oral vs injetável (usa mesmos parâmetros públicos por molécula), unidades absolutas, multi-medicação simultânea (usa a medicação da dose mais recente).
