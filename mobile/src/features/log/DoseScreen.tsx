import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { parseDecimalBR } from '@/core/text';
import type { DoseRoute } from '@/core/types';
import {
  AppText,
  Button,
  Card,
  DisclaimerBanner,
  Input,
  NumberField,
  Screen,
  SegmentedChips,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { db } from '@/db/client';
import { addDose, lastInjectionSite } from '@/db/doseRepo';
import { getSetting } from '@/db/settingsRepo';
import { INJECTION_SITES, InjectionSite, suggestNextSite } from '@/features/dose/rotation';
import { strings } from '@/i18n/pt-BR';
import { scheduleDoseReminder } from '@/services/reminders/reminders';

type MedKey = keyof typeof strings.dose.medications;
type NextDoseKey = keyof typeof strings.dose.nextDose;

const MED_OPTIONS = (Object.keys(strings.dose.medications) as MedKey[]).map((value) => ({
  value,
  label: strings.dose.medications[value],
}));

const ROUTE_OPTIONS = (Object.keys(strings.dose.routes) as DoseRoute[]).map((value) => ({
  value,
  label: strings.dose.routes[value],
}));

const NEXT_OPTIONS = (Object.keys(strings.dose.nextDose) as NextDoseKey[]).map((value) => ({
  value,
  label: strings.dose.nextDose[value],
}));

function nextDoseDate(choice: NextDoseKey): Date | null {
  if (choice === 'none') return null;
  const d = new Date();
  d.setDate(d.getDate() + (choice === 'in7days' ? 7 : 1));
  return d;
}

export function DoseScreen() {
  const [medication, setMedication] = useState<MedKey | null>(null);
  const [customMed, setCustomMed] = useState('');
  const [doseStr, setDoseStr] = useState('');
  const [route, setRoute] = useState<DoseRoute>('injecao');
  const [lastSite, setLastSite] = useState<InjectionSite | null>(null);
  const [site, setSite] = useState<InjectionSite | null>(null);
  const [nextChoice, setNextChoice] = useState<NextDoseKey>('none');

  useEffect(() => {
    lastInjectionSite(db).then((last) => {
      setLastSite(last);
      setSite(suggestNextSite(last));
    });
  }, []);

  const suggested = useMemo(() => suggestNextSite(lastSite), [lastSite]);

  const siteOptions = INJECTION_SITES.map((value) => ({
    value,
    label: strings.dose.sites[value],
    sublabel:
      value === lastSite
        ? strings.dose.lastSiteLabel
        : value === suggested
          ? strings.dose.suggestedLabel
          : undefined,
  }));

  const doseMg = parseDecimalBR(doseStr);
  const medName = medication === 'outra' ? customMed.trim() : medication;
  const valid = Boolean(medName) && doseMg !== null && doseMg > 0;

  async function save() {
    if (!valid || !medName || doseMg === null) return;
    const nextDoseAt = nextDoseDate(nextChoice);
    await addDose(db, {
      medication: medName,
      doseMg,
      route,
      injectionSite: route === 'injecao' ? site : null,
      at: new Date(),
      nextDoseAt,
    });
    if (nextDoseAt) {
      const reminders = await getSetting<{ doseEnabled?: boolean }>(db, 'reminders');
      if (reminders?.doseEnabled) await scheduleDoseReminder(nextDoseAt);
    }
    router.back();
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
          />
        ) : null}
        <NumberField
          label={strings.dose.doseLabel}
          value={doseStr}
          onChangeText={setDoseStr}
          suffix="mg"
          placeholder="0,0"
        />
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
          <SegmentedChips options={siteOptions} value={site} onChange={setSite} />
          <AppText variant="caption" muted>
            {strings.dose.siteHint}
          </AppText>
        </Card>
      ) : null}
      <Card style={{ gap: spacing.md }}>
        <AppText variant="caption" muted>
          {strings.dose.nextDoseLabel}
        </AppText>
        <SegmentedChips options={NEXT_OPTIONS} value={nextChoice} onChange={setNextChoice} />
      </Card>
      <Button label={strings.dose.save} onPress={save} disabled={!valid} />
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
