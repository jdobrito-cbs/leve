import { numberLocale } from '@/i18n/engine';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  formatDateBR,
  formatDateTimeLabel,
  formatTimeHM,
  parseDateTimeBR,
} from '@/core/datetime';
import { parseDecimalBR } from '@/core/text';
import {
  AppText,
  Button,
  Card,
  DateTimeField,
  ListRow,
  NumberField,
  RulerField,
  Screen,
  SegmentedChips,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { GymLog, addGymLog, deleteGymLog, gymKcalForDay, listGymLogs } from '@/db/gymRepo';
import { latestWeight } from '@/db/weightRepo';
import { GYM_EXERCISES, GymExerciseKey, estimateKcal } from '@/features/gym/exercises';
import { isLocked } from '@/features/premium/gates';
import { usePremium } from '@/features/premium/usePremium';
import { strings } from '@/i18n/pt-BR';
import { displayToKg, formatWeight, kgToDisplay, weightUnit } from '@/core/units';

const ALL_KEYS = Object.keys(GYM_EXERCISES) as GymExerciseKey[];
const strengthOptions = () => ALL_KEYS.filter((k) => GYM_EXERCISES[k].kind === 'forca').map((value) => ({
  value,
  label: strings.gym.exercises[value],
}));
const cardioOptions = () => ALL_KEYS.filter((k) => GYM_EXERCISES[k].kind === 'cardio').map((value) => ({
  value,
  label: strings.gym.exercises[value],
}));

function detailLabel(log: GymLog): string {
  if (log.kind === 'cardio') return `${log.minutes ?? 0} ${strings.gym.minShort}`;
  const weight = log.weightKg ? ` · ${formatWeight(log.weightKg, 0)}` : '';
  return `${log.sets}${strings.gym.setsShort}${log.reps}${weight}`;
}

export function GymScreen() {
  const { colors } = useTheme();
  const { premium } = usePremium();
  const [exercise, setExercise] = useState<GymExerciseKey>('supino');
  const [weightStr, setWeightStr] = useState('');
  const [setsStr, setSetsStr] = useState('3');
  const [repsStr, setRepsStr] = useState('12');
  const [minutesStr, setMinutesStr] = useState('30');
  const [bodyKg, setBodyKg] = useState(70);
  const [list, setList] = useState<GymLog[]>([]);
  const [todayKcal, setTodayKcal] = useState(0);
  const [saved, setSaved] = useState(false);
  const [dateStr, setDateStr] = useState(formatDateBR(new Date()));
  const [timeStr, setTimeStr] = useState(formatTimeHM(new Date()));
  const at = parseDateTimeBR(dateStr, timeStr);

  const kind = GYM_EXERCISES[exercise].kind;
  const enteredWeight = parseDecimalBR(weightStr);
  const weightKg = enteredWeight !== null ? Math.round(displayToKg(enteredWeight) * 10) / 10 : null;
  const sets = parseDecimalBR(setsStr);
  const reps = parseDecimalBR(repsStr);
  const minutes = parseDecimalBR(minutesStr);

  const kcal = estimateKcal(exercise, bodyKg, {
    sets: sets !== null ? Math.round(sets) : null,
    reps: reps !== null ? Math.round(reps) : null,
    weightKg,
    minutes,
  });

  const load = useCallback(async () => {
    const [logs, total, weight] = await Promise.all([
      listGymLogs(db),
      gymKcalForDay(db, new Date()),
      latestWeight(db),
    ]);
    setList(logs);
    setTodayKcal(total);
    if (weight) setBodyKg(weight.weightKg);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (kcal === null || !at) return;
    await addGymLog(db, {
      exercise,
      kind,
      weightKg: kind === 'forca' ? weightKg : null,
      sets: kind === 'forca' && sets !== null ? Math.round(sets) : null,
      reps: kind === 'forca' && reps !== null ? Math.round(reps) : null,
      minutes: kind === 'cardio' ? minutes : null,
      kcal,
      at,
    });
    setSaved(true);
    await load();
  }

  if (isLocked('gym', premium)) {
    return (
      <Screen>
        <AppText variant="display">{strings.gym.title}</AppText>
        <Card style={{ gap: spacing.md }}>
          <AppText variant="caption" muted>
            {strings.premium.gymLockedBody}
          </AppText>
          <Button
            label={strings.premium.discover}
            onPress={() => router.push('/assinatura' as never)}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="display">{strings.gym.title}</AppText>
      <Card style={{ gap: spacing.md }}>
        <AppText variant="caption" muted>
          {strings.gym.exerciseLabel} — {strings.gym.strengthGroup}
        </AppText>
        <SegmentedChips
          options={strengthOptions()}
          value={exercise}
          onChange={(v) => {
            setSaved(false);
            setExercise(v);
          }}
        />
        <AppText variant="caption" muted>
          {strings.gym.exerciseLabel} — {strings.gym.cardioGroup}
        </AppText>
        <SegmentedChips
          options={cardioOptions()}
          value={exercise}
          onChange={(v) => {
            setSaved(false);
            setExercise(v);
          }}
        />
      </Card>

      <Card style={{ gap: spacing.md }}>
        {kind === 'forca' ? (
          <>
            <RulerField
              label={strings.gym.weightLabel}
              value={weightStr}
              onChangeText={(v) => {
                setSaved(false);
                setWeightStr(v);
              }}
              suffix={weightUnit()}
              placeholder="0"
              min={0}
              max={Math.round(kgToDisplay(300))}
              step={0.5}
              majorEvery={10}
              labelEvery={20}
              fallback={Math.round(kgToDisplay(20))}
            />
            <NumberField
              label={strings.gym.setsLabel}
              value={setsStr}
              onChangeText={(v) => {
                setSaved(false);
                setSetsStr(v);
              }}
              placeholder="3"
            />
            <NumberField
              label={strings.gym.repsLabel}
              value={repsStr}
              onChangeText={(v) => {
                setSaved(false);
                setRepsStr(v);
              }}
              placeholder="12"
            />
          </>
        ) : (
          <NumberField
            label={strings.gym.minutesLabel}
            value={minutesStr}
            onChangeText={(v) => {
              setSaved(false);
              setMinutesStr(v);
            }}
            placeholder="30"
          />
        )}
        <DateTimeField
          dateValue={dateStr}
          timeValue={timeStr}
          onChangeDate={setDateStr}
          onChangeTime={setTimeStr}
        />
        {kcal !== null ? (
          <AppText>
            {strings.gym.estimateLabel}: ≈ {kcal.toLocaleString(numberLocale())} kcal
          </AppText>
        ) : null}
        <AppText variant="caption" muted>
          {strings.gym.estimateNote}
        </AppText>
        <Button label={strings.gym.save} onPress={save} disabled={kcal === null || !at} />
        {saved ? (
          <AppText variant="caption" style={{ color: colors.success }}>
            {strings.gym.savedLabel}
          </AppText>
        ) : null}
      </Card>

      {todayKcal > 0 ? (
        <Card>
          <AppText variant="title">
            {strings.gym.todayTotal}: {Math.round(todayKcal).toLocaleString(numberLocale())} kcal
          </AppText>
        </Card>
      ) : null}

      {list.length > 0 ? (
        <Card>
          <AppText variant="title">{strings.common.historyTitle}</AppText>
          {list.map((log) => (
            <ListRow
              key={log.id}
              title={
                strings.gym.exercises[log.exercise as GymExerciseKey] ?? log.exercise
              }
              subtitle={`${formatDateTimeLabel(log.loggedAt)} · ${detailLabel(log)}`}
              right={`${Math.round(log.kcal).toLocaleString(numberLocale())} kcal`}
              onDelete={async () => {
                await deleteGymLog(db, log.id);
                await load();
              }}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
