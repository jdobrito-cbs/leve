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
  Screen,
  SegmentedChips,
  ValueRuler,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { GymLog, addGymLog, deleteGymLog, gymKcalForDay, listGymLogs } from '@/db/gymRepo';
import { latestWeight } from '@/db/weightRepo';
import { GYM_EXERCISES, GymExerciseKey, estimateKcal } from '@/features/gym/exercises';
import { strings } from '@/i18n/pt-BR';

const ALL_KEYS = Object.keys(GYM_EXERCISES) as GymExerciseKey[];
const STRENGTH_OPTIONS = ALL_KEYS.filter((k) => GYM_EXERCISES[k].kind === 'forca').map((value) => ({
  value,
  label: strings.gym.exercises[value],
}));
const CARDIO_OPTIONS = ALL_KEYS.filter((k) => GYM_EXERCISES[k].kind === 'cardio').map((value) => ({
  value,
  label: strings.gym.exercises[value],
}));

function detailLabel(log: GymLog): string {
  if (log.kind === 'cardio') return `${log.minutes ?? 0} ${strings.gym.minShort}`;
  const weight = log.weightKg ? ` · ${log.weightKg.toLocaleString('pt-BR')} kg` : '';
  return `${log.sets}${strings.gym.setsShort}${log.reps}${weight}`;
}

export function GymScreen() {
  const { colors } = useTheme();
  const [exercise, setExercise] = useState<GymExerciseKey>('supino');
  const [weightStr, setWeightStr] = useState('');
  const [setsStr, setSetsStr] = useState('3');
  const [repsStr, setRepsStr] = useState('12');
  const [minutesStr, setMinutesStr] = useState('30');
  const [bodyKg, setBodyKg] = useState(70);
  const [list, setList] = useState<GymLog[]>([]);
  const [todayKcal, setTodayKcal] = useState(0);
  const [saved, setSaved] = useState(false);
  const [rulerOpen, setRulerOpen] = useState(false);
  const [dateStr, setDateStr] = useState(formatDateBR(new Date()));
  const [timeStr, setTimeStr] = useState(formatTimeHM(new Date()));
  const at = parseDateTimeBR(dateStr, timeStr);

  const kind = GYM_EXERCISES[exercise].kind;
  const weightKg = parseDecimalBR(weightStr);
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

  return (
    <Screen>
      <AppText variant="display">{strings.gym.title}</AppText>
      <Card style={{ gap: spacing.md }}>
        <AppText variant="caption" muted>
          {strings.gym.exerciseLabel} — {strings.gym.strengthGroup}
        </AppText>
        <SegmentedChips
          options={STRENGTH_OPTIONS}
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
          options={CARDIO_OPTIONS}
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
            <NumberField
              label={strings.gym.weightLabel}
              value={weightStr}
              onChangeText={(v) => {
                setSaved(false);
                setWeightStr(v);
              }}
              onFocus={() => setRulerOpen(true)}
              suffix="kg"
              placeholder="0"
            />
            {rulerOpen ? (
              <ValueRuler
                value={weightKg ?? 20}
                min={0}
                max={300}
                step={0.5}
                majorEvery={10}
                labelEvery={20}
                onChange={(v) => {
                  setSaved(false);
                  setWeightStr(v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }));
                }}
              />
            ) : null}
            <NumberField
              label={strings.gym.setsLabel}
              value={setsStr}
              onChangeText={(v) => {
                setSaved(false);
                setSetsStr(v);
              }}
              onFocus={() => setRulerOpen(false)}
              placeholder="3"
            />
            <NumberField
              label={strings.gym.repsLabel}
              value={repsStr}
              onChangeText={(v) => {
                setSaved(false);
                setRepsStr(v);
              }}
              onFocus={() => setRulerOpen(false)}
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
            onFocus={() => setRulerOpen(false)}
            placeholder="30"
          />
        )}
        <DateTimeField
          dateValue={dateStr}
          timeValue={timeStr}
          onChangeDate={setDateStr}
          onChangeTime={setTimeStr}
          onFieldFocus={() => setRulerOpen(false)}
        />
        {kcal !== null ? (
          <AppText>
            {strings.gym.estimateLabel}: ≈ {kcal.toLocaleString('pt-BR')} kcal
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
            {strings.gym.todayTotal}: {Math.round(todayKcal).toLocaleString('pt-BR')} kcal
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
              right={`${Math.round(log.kcal).toLocaleString('pt-BR')} kcal`}
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
