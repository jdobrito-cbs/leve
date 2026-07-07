import { strings } from '@/i18n/pt-BR';

/**
 * Observações informativas — NUNCA diagnóstico ou conduta clínica.
 * Regras baseadas em referências públicas gerais; todo texto de "atenção"
 * termina orientando a conversar com o médico.
 */

export interface Insight {
  id: string;
  kind: 'positivo' | 'atencao';
  text: string;
}

export interface Point {
  value: number;
}

export interface InsightInput {
  weights28: Point[]; // últimos 28 dias, ordem cronológica
  bodyFat28: Point[]; // % gordura
  muscle28: Point[]; // massa muscular (esquelética > muscular > magra, a que houver)
  bodyWater28: Point[]; // kg
  sleep7: number[]; // horas por noite, últimos 7 dias
  restingHr7: number[]; // bpm, últimos 7 dias
  restingHr30: number[]; // bpm, dias 8–30 atrás
  waterPctOfGoal7: number[]; // razão ingestão/meta por dia, últimos 7 dias
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Diferença entre a média da metade recente e a da metade antiga (null se <4 pontos). */
function trend(points: Point[]): number | null {
  if (points.length < 4) return null;
  const mid = Math.floor(points.length / 2);
  return avg(points.slice(mid).map((p) => p.value)) - avg(points.slice(0, mid).map((p) => p.value));
}

const fmt = (n: number) =>
  `${n >= 0 ? '+' : '−'}${Math.abs(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}`;

export function buildInsights(input: InsightInput): Insight[] {
  const out: Insight[] = [];
  const t = strings.insights;

  const dWeight = trend(input.weights28);
  const dFat = trend(input.bodyFat28);
  const dMuscle = trend(input.muscle28);
  const dWater = trend(input.bodyWater28);

  if (dWeight !== null && dFat !== null && dMuscle !== null) {
    if (dWeight > 0.3 && dFat <= -0.3 && dMuscle >= 0.2) {
      out.push({
        id: 'recomp-positiva',
        kind: 'positivo',
        text: `${t.recompGood} (${fmt(dWeight)} kg, gordura ${fmt(dFat)}%, músculo ${fmt(dMuscle)} kg). ${t.informative}`,
      });
    } else if (dWeight > 0.3 && dFat >= 0.3 && (dMuscle <= -0.2 || (dWater !== null && dWater <= -0.2))) {
      out.push({
        id: 'recomp-atencao',
        kind: 'atencao',
        text: `${t.recompBad} (${fmt(dWeight)} kg, gordura ${fmt(dFat)}%). ${t.talkToDoctor}`,
      });
    } else if (dWeight < -0.5 && dMuscle <= -0.3) {
      out.push({
        id: 'perda-massa-magra',
        kind: 'atencao',
        text: `${t.muscleLoss} (músculo ${fmt(dMuscle)} kg). ${t.talkToDoctor}`,
      });
    }
  }

  if (input.sleep7.length >= 3 && avg(input.sleep7) < 6) {
    out.push({
      id: 'sono-baixo',
      kind: 'atencao',
      text: `${t.sleepLow} (média de ${avg(input.sleep7).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h; referência geral: 7–9 h). ${t.talkToDoctor}`,
    });
  }

  if (input.restingHr7.length >= 3 && input.restingHr30.length >= 5) {
    const recent = avg(input.restingHr7);
    const base = avg(input.restingHr30);
    if (recent > base * 1.1) {
      out.push({
        id: 'fc-repouso-alta',
        kind: 'atencao',
        text: `${t.hrUp} (${Math.round(recent)} bpm vs ${Math.round(base)} bpm no mês). ${t.talkToDoctor}`,
      });
    }
  }

  if (input.waterPctOfGoal7.length >= 5) {
    const lowDays = input.waterPctOfGoal7.filter((p) => p < 0.6).length;
    if (lowDays >= 5) {
      out.push({
        id: 'hidratacao-baixa',
        kind: 'atencao',
        text: `${t.hydrationLow} (${lowDays} dos últimos ${input.waterPctOfGoal7.length} dias abaixo de 60% da meta). ${t.informative}`,
      });
    }
  }

  return out;
}
