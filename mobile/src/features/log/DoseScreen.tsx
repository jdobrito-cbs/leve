import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  formatDateBR,
  formatDateTimeLabel,
  formatTimeHM,
  parseDateTimeBR,
} from '@/core/datetime';
import { parseDecimalBR } from '@/core/text';
import type { DoseLog, DoseRoute } from '@/core/types';
import {
  AppText,
  Button,
  Card,
  DateTimeField,
  DisclaimerBanner,
  Input,
  ListRow,
  NumberField,
  Screen,
  SegmentedChips,
  ValueRuler,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { addDose, deleteDose, lastInjectionSite, listDoses } from '@/db/doseRepo';
import { getSetting } from '@/db/settingsRepo';
import { BodyMapPicker } from '@/features/dose/BodyMapPicker';
import { InjectionSite, suggestNextSite } from '@/features/dose/rotation';
import { strings } from '@/i18n/pt-BR';
import { scheduleDoseReminder } from '@/services/reminders/reminders';

type MedKey = keyof typeof strings.dose.medications;

const MED_OPTIONS = (Object.keys(strings.dose.medications) as MedKey[]).map((value) => ({
  value,
  label: strings.dose.medications[value],
}));

const ROUTE_OPTIONS = (Object.keys(strings.dose.routes) as DoseRoute[]).map((value) => ({
  value,
  label: strings.dose.routes[value],
}));

export function DoseScreen() {
  const { colors } = useTheme();
  const [medication, setMedication] = useState<MedKey | null>(null);
  const [customMed, setCustomMed] = useState('');
  const [doseStr, setDoseStr] = useState('');
  const [route, setRoute] = useState<DoseRoute>('injecao');
  const [lastSite, setLastSite] = useState<InjectionSite | null>(null);
  const [site, setSite] = useState<InjectionSite | null>(null);
  const [list, setList] = useState<DoseLog[]>([]);
  const [saved, setSaved] = useState(false);
  const [rulerOpen, setRulerOpen] = useState(false);
  const [dateStr, setDateStr] = useState(formatDateBR(new Date()));
  const [timeStr, setTimeStr] = useState(formatTimeHM(new Date()));

  const load = useCallback(async () => {
    const [last, doses] = await Promise.all([lastInjectionSite(db), listDoses(db)]);
    setLastSite(last);
    setSite(suggestNextSite(last));
    setList(doses);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const suggested = useMemo(() => suggestNextSite(lastSite), [lastSite]);

  const doseMg = parseDecimalBR(doseStr);
  const at = parseDateTimeBR(dateStr, timeStr);
  const medName = medication === 'outra' ? customMed.trim() : medication;
  const valid = Boolean(medName) && doseMg !== null && doseMg > 0 && at !== null;

  async function save() {
    if (!valid || !medName || doseMg === null || !at) return;
    // Intervalo é configuração global (Perfil): define próxima dose e lembrete.
    const intervalDays = (await getSetting<number>(db, 'doseIntervalDays')) ?? 7;
    const nextDoseAt =
      intervalDays > 0 ? new Date(at.getTime() + intervalDays * 24 * 3600 * 1000) : null;
    await addDose(db, {
      medication: medName,
      doseMg,
      route,
      injectionSite: route === 'injecao' ? site : null,
      at,
      nextDoseAt,
    });
    if (nextDoseAt) {
      const reminders = await getSetting<{ doseEnabled?: boolean }>(db, 'reminders');
      if (reminders?.doseEnabled) await scheduleDoseReminder(nextDoseAt);
    }
    setDoseStr('');
    setSaved(true);
    await load();
  }

  async function remove(id: number) {
    await deleteDose(db, id);
    await load();
  }

  function doseRowTitle(d: DoseLog): string {
    const label = strings.dose.medications[d.medication as MedKey] ?? d.medication;
    return `${label} · ${d.doseMg.toLocaleString('pt-BR')} mg`;
  }

  return (
    <Screen>
      <AppText variant="display">{strings.dose.title}</AppText>
      <DisclaimerBanner />
      <Card style={{ gap: spacing.md }}>
        <AppText variant="caption" muted>
          {strings.dose.medicationLabel}
        </AppText>
        <SegmentedChips options={MED_OPTIONS} value={medication} onChange={setMedication} />
        {medication === 'outra' ? (
          <Input
            label={strings.dose.customMedicationLabel}
            value={customMed}
            onChangeText={setCustomMed}
            onFocus={() => setRulerOpen(false)}
          />
        ) : null}
        <NumberField
          label={strings.dose.doseLabel}
          value={doseStr}
          onChangeText={setDoseStr}
          onFocus={() => setRulerOpen(true)}
          suffix="mg"
          placeholder="0,0"
        />
        {rulerOpen ? (
          <ValueRuler
            value={doseMg ?? 1}
            min={0}
            max={30}
            step={0.1}
            majorEvery={10}
            labelEvery={10}
            onChange={(v) => {
              setSaved(false);
              setDoseStr(
                v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
              );
            }}
          />
        ) : null}
        <AppText variant="caption" muted>
          {strings.dose.routeLabel}
        </AppText>
        <SegmentedChips options={ROUTE_OPTIONS} value={route} onChange={setRoute} />
      </Card>
      {route === 'injecao' ? (
        <Card style={{ gap: spacing.md }}>
          <AppText variant="caption" muted>
            {strings.dose.siteLabel}
          </AppText>
          <BodyMapPicker value={site} onChange={setSite} lastSite={lastSite} suggested={suggested} />
          <AppText variant="caption" muted>
            {strings.dose.siteHint}
          </AppText>
        </Card>
      ) : null}
      <Card style={{ gap: spacing.md }}>
        <DateTimeField
          dateValue={dateStr}
          timeValue={timeStr}
          onChangeDate={setDateStr}
          onChangeTime={setTimeStr}
          onFieldFocus={() => setRulerOpen(false)}
        />
      </Card>
      <Button label={strings.dose.save} onPress={save} disabled={!valid} />
      {saved ? (
        <AppText variant="caption" style={{ color: colors.success, textAlign: 'center' }}>
          {strings.dose.savedLabel}
        </AppText>
      ) : null}
      {list.length > 0 ? (
        <Card>
          <AppText variant="title">{strings.common.historyTitle}</AppText>
          {list.map((d) => (
            <ListRow
              key={d.id}
              title={doseRowTitle(d)}
              subtitle={
                d.injectionSite
                  ? `${formatDateTimeLabel(d.loggedAt)} · ${strings.dose.sites[d.injectionSite as InjectionSite]}`
                  : formatDateTimeLabel(d.loggedAt)
              }
              onDelete={() => remove(d.id)}
            />
          ))}
        </Card>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
