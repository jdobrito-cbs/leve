import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppText, Button, Card, DisclaimerBanner, ListRow, Screen, SegmentedChips } from '@/design/components';
import { spacing } from '@/design/tokens';
import { db } from '@/db/client';
import {
  PeriodLog,
  endPeriod,
  listPeriods,
  openPeriod,
  predictNextPeriod,
  setFlow,
  startPeriod,
} from '@/features/cycle/periodRepo';
import { strings } from '@/i18n/pt-BR';

type FlowKey = keyof typeof strings.cycle.flows;

const FLOW_OPTIONS = (Object.keys(strings.cycle.flows) as FlowKey[]).map((value) => ({
  value,
  label: strings.cycle.flows[value],
}));

export function CycleScreen() {
  const [open, setOpen] = useState<PeriodLog | null>(null);
  const [history, setHistory] = useState<PeriodLog[]>([]);

  const load = useCallback(async () => {
    setOpen(await openPeriod(db));
    setHistory(await listPeriods(db));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const prediction = predictNextPeriod(history);
  const dayOfCycle = open
    ? Math.floor((Date.now() - new Date(open.startedAt).getTime()) / 86400000) + 1
    : null;

  return (
    <Screen>
      <AppText variant="display">{strings.cycle.title}</AppText>
      <Card style={{ gap: spacing.md }}>
        {open ? (
          <>
            <AppText variant="title">
              {strings.cycle.activeSince}{' '}
              {new Date(open.startedAt).toLocaleDateString('pt-BR')} — {dayOfCycle}º{' '}
              {strings.cycle.dayOfCycle}
            </AppText>
            <AppText variant="caption" muted>
              {strings.cycle.flowLabel}
            </AppText>
            <SegmentedChips
              options={FLOW_OPTIONS}
              value={(open.flow as FlowKey | null) ?? null}
              onChange={async (flow) => {
                await setFlow(db, flow);
                await load();
              }}
            />
            <Button
              label={strings.cycle.endToday}
              onPress={async () => {
                await endPeriod(db, new Date());
                await load();
              }}
            />
          </>
        ) : (
          <>
            {prediction ? (
              <AppText>
                {strings.cycle.predicted}{' '}
                {prediction.expectedAt.toLocaleDateString('pt-BR')} ({strings.cycle.avgCycle}{' '}
                {prediction.avgCycleDays} dias)
              </AppText>
            ) : (
              <AppText muted>{strings.cycle.empty}</AppText>
            )}
            <Button
              label={strings.cycle.startToday}
              onPress={async () => {
                await startPeriod(db, new Date());
                await load();
              }}
            />
          </>
        )}
        <AppText variant="caption" muted>
          {strings.cycle.predictionHint}
        </AppText>
      </Card>
      {history.length > 0 ? (
        <Card>
          <AppText variant="title">{strings.cycle.history}</AppText>
          {history.map((p) => (
            <ListRow
              key={p.id}
              title={`${new Date(p.startedAt).toLocaleDateString('pt-BR')}${
                p.endedAt ? ` — ${new Date(p.endedAt).toLocaleDateString('pt-BR')}` : ''
              }`}
              right={p.flow ? strings.cycle.flows[p.flow as FlowKey] : undefined}
            />
          ))}
        </Card>
      ) : null}
      <DisclaimerBanner />
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
