import { numberLocale } from '@/i18n/engine';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import type { DoseLog } from '@/core/types';
import { formatDateBR } from '@/core/datetime';
import { AppText, Button, Card, FitChart, IconChip, Screen } from '@/design/components';
import { NotesWritingIcon, SyringeInjectIcon } from '@/design/logIcons';
import { fonts, spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { latestDose, listDoses } from '@/db/doseRepo';
import { symptomsForDay } from '@/db/symptomRepo';
import { estimateRelativeCurve } from '@/features/pk/pharmacokinetics';
import { strings } from '@/i18n/pt-BR';

const fmt = (n: number, digits = 0) =>
  n.toLocaleString(numberLocale(), { maximumFractionDigits: digits });

export function MedicationScreen() {
  const { colors } = useTheme();
  const [doses, setDoses] = useState<DoseLog[]>([]);
  const [last, setLast] = useState<DoseLog | null>(null);
  const [symptomsToday, setSymptomsToday] = useState(0);
  const [nowTs, setNowTs] = useState(0);

  useEffect(() => {
    listDoses(db)
      .then(setDoses)
      .catch(() => setDoses([]));
    latestDose(db)
      .then(setLast)
      .catch(() => setLast(null));
    symptomsForDay(db, new Date())
      .then((s) => setSymptomsToday(s.length))
      .catch(() => setSymptomsToday(0));
    setNowTs(Date.now());
  }, []);

  const pk = useMemo(() => estimateRelativeCurve(doses), [doses]);

  const nextTs = last?.nextDoseAt ? new Date(last.nextDoseAt).getTime() : null;
  const lastTs = last ? new Date(last.loggedAt).getTime() : null;
  const daysToNext =
    nextTs !== null ? Math.max(0, Math.ceil((nextTs - nowTs) / 86400000)) : null;
  const doseProgress =
    nextTs !== null && lastTs !== null && nextTs > lastTs
      ? Math.min(1, Math.max(0, (nowTs - lastTs) / (nextTs - lastTs)))
      : 0;

  return (
    <Screen>
      <AppText variant="display">{strings.today.medicationSection}</AppText>

      <Card style={{ gap: spacing.sm }}>
        {pk ? (
          <>
            <FitChart>
              {(width) => (
                <LineChart
                  data={pk.points.map((p, i, arr) => ({
                    value: Math.round(p.level * 100),
                    hideDataPoint: i !== pk.peakIndex && i !== arr.length - 1,
                    dataPointText:
                      i === pk.peakIndex
                        ? `${fmt(pk.latestDoseMg, 1)} mg`
                        : i === arr.length - 1
                          ? `≈ ${fmt(pk.endMgEstimate, 1)} mg`
                          : undefined,
                    textShiftY: -6,
                    textShiftX: i === arr.length - 1 ? -30 : -16,
                  }))}
                  color={colors.primary}
                  thickness={3}
                  height={150}
                  width={width - 40}
                  initialSpacing={8}
                  endSpacing={40}
                  maxValue={125}
                  areaChart
                  startFillColor={colors.primary}
                  startOpacity={0.18}
                  endFillColor={colors.primary}
                  endOpacity={0.01}
                  dataPointsColor={colors.primary}
                  dataPointsRadius={4}
                  textColor={colors.text}
                  textFontSize={11}
                  hideAxesAndRules
                  hideYAxisText
                  adjustToWidth
                  curved
                  disableScroll
                />
              )}
            </FitChart>
            <AppText variant="caption" muted>
              {pk.medKey} · {strings.progress.pkRelative} · {strings.progress.pkProjection}
            </AppText>
          </>
        ) : (
          <AppText variant="caption" muted>
            {strings.today.noDoseYet}
          </AppText>
        )}
        <AppText variant="caption" muted>
          {strings.progress.pkDisclaimer}
        </AppText>
      </Card>

      {last ? (
        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="caption" muted>
              {strings.today.cards.nextDose}
            </AppText>
            <AppText style={{ fontFamily: fonts.semibold, color: colors.primary }}>
              {last.nextDoseAt
                ? `${formatDateBR(new Date(last.nextDoseAt))}${daysToNext !== null ? ` · ${daysToNext}d` : ''}`
                : '—'}
            </AppText>
          </View>
          <View
            style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' }}
          >
            <View
              style={{
                width: `${Math.round(doseProgress * 100)}%`,
                height: '100%',
                backgroundColor: colors.primary,
                borderRadius: 4,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="caption" muted>
              {strings.progress.pkLastDose}
            </AppText>
            <AppText variant="caption">
              {last.medication} · {fmt(last.doseMg, 1)} mg · {formatDateBR(new Date(last.loggedAt))}
            </AppText>
          </View>
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Pressable
          accessibilityRole="button"
          style={{ flex: 1 }}
          onPress={() => router.push('/log/dose' as never)}
        >
          <Card style={{ gap: spacing.xs, flex: 1 }}>
            <IconChip size={32}>
              <SyringeInjectIcon size={16} />
            </IconChip>
            <AppText variant="caption" muted>
              {strings.dose.siteLabel}
            </AppText>
            <AppText style={{ fontFamily: fonts.semibold }}>{last?.injectionSite ?? '—'}</AppText>
          </Card>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={{ flex: 1 }}
          onPress={() => router.push('/log/sintoma' as never)}
        >
          <Card style={{ gap: spacing.xs, flex: 1 }}>
            <IconChip size={32}>
              <NotesWritingIcon size={16} />
            </IconChip>
            <AppText variant="caption" muted>
              {strings.today.cards.symptoms}
            </AppText>
            <AppText style={{ fontFamily: fonts.semibold }}>
              {symptomsToday > 0 ? String(symptomsToday) : strings.today.none}
            </AppText>
          </Card>
        </Pressable>
      </View>

      <Button label={strings.dose.title} onPress={() => router.push('/log/dose' as never)} />
      <Button
        label={strings.common.close}
        variant="secondary"
        onPress={() => router.back()}
      />
    </Screen>
  );
}
