import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  formatDateBR,
  formatDateTimeLabel,
  formatTimeHM,
  parseDateTimeBR,
} from '@/core/datetime';
import {
  AppText,
  Button,
  Card,
  DateTimeField,
  Input,
  ListRow,
  Screen,
  SegmentedChips,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import {
  Appointment,
  addAppointment,
  deleteAppointment,
  listAppointments,
} from '@/db/appointmentsRepo';
import { getSetting } from '@/db/settingsRepo';
import { isLocked } from '@/features/premium/gates';
import { usePremium } from '@/features/premium/usePremium';
import { strings } from '@/i18n/pt-BR';
import {
  ReminderSettings,
  applyAppointmentReminders,
  requestNotificationPermission,
} from '@/services/reminders/reminders';

type SpecialtyKey = keyof typeof strings.appointments.specialties;

const SPECIALTY_OPTIONS = (
  Object.keys(strings.appointments.specialties) as SpecialtyKey[]
).map((value) => ({ value, label: strings.appointments.specialties[value] }));

/** Reaplica os avisos com base no toggle do Perfil e nas consultas atuais. */
async function rescheduleReminders() {
  const reminders = await getSetting<ReminderSettings>(db, 'reminders');
  const appts = await listAppointments(db);
  await applyAppointmentReminders(reminders?.appointmentsEnabled ?? false, appts);
}

export function AppointmentsScreen() {
  const { colors } = useTheme();
  const { premium } = usePremium();
  const [list, setList] = useState<Appointment[]>([]);
  const [place, setPlace] = useState('');
  const [specialty, setSpecialty] = useState<SpecialtyKey | null>(null);
  const [otherSpecialty, setOtherSpecialty] = useState('');
  const [doctor, setDoctor] = useState('');
  const [saved, setSaved] = useState(false);
  const [dateStr, setDateStr] = useState(formatDateBR(new Date()));
  const [timeStr, setTimeStr] = useState(formatTimeHM(new Date()));
  const at = parseDateTimeBR(dateStr, timeStr);

  const load = useCallback(async () => {
    setList(await listAppointments(db));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLocked('appointments', premium)) {
    return (
      <Screen>
        <AppText variant="display">{strings.appointments.title}</AppText>
        <Card style={{ gap: spacing.md }}>
          <AppText variant="caption" muted>
            {strings.premium.appointmentsLockedBody}
          </AppText>
          <Button
            label={strings.premium.discover}
            onPress={() => router.push('/assinatura' as never)}
          />
        </Card>
        {router.canGoBack?.() ? (
          <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
        ) : null}
      </Screen>
    );
  }

  const specialtyName =
    specialty === 'outra'
      ? otherSpecialty.trim()
      : specialty
        ? strings.appointments.specialties[specialty]
        : '';
  const valid = place.trim().length > 0 && specialtyName.length > 0 && at !== null;

  async function save() {
    if (!valid || !at) return;
    await addAppointment(db, {
      place: place.trim(),
      specialty: specialtyName,
      doctor: doctor.trim() || null,
      at,
    });
    await requestNotificationPermission();
    await rescheduleReminders();
    setPlace('');
    setSpecialty(null);
    setOtherSpecialty('');
    setDoctor('');
    setSaved(true);
    await load();
  }

  async function remove(id: number) {
    await deleteAppointment(db, id);
    await rescheduleReminders();
    await load();
  }

  const now = Date.now();
  const upcoming = list.filter((a) => new Date(a.scheduledAt).getTime() >= now);
  const past = list.filter((a) => new Date(a.scheduledAt).getTime() < now).reverse();

  const row = (a: Appointment) => (
    <ListRow
      key={a.id}
      title={`${a.specialty} · ${a.place}`}
      subtitle={`${formatDateTimeLabel(a.scheduledAt)}${a.doctor ? ` · ${a.doctor}` : ''}`}
      onDelete={() => remove(a.id)}
    />
  );

  return (
    <Screen>
      <AppText variant="display">{strings.appointments.title}</AppText>
      <Card style={{ gap: spacing.md }}>
        <Input
          label={strings.appointments.placeLabel}
          value={place}
          onChangeText={(v) => {
            setSaved(false);
            setPlace(v);
          }}
          placeholder={strings.appointments.placeLabel}
        />
        <AppText variant="caption" muted>
          {strings.appointments.specialtyLabel}
        </AppText>
        <SegmentedChips
          options={SPECIALTY_OPTIONS}
          value={specialty}
          onChange={(v) => {
            setSaved(false);
            setSpecialty(v);
          }}
        />
        {specialty === 'outra' ? (
          <Input
            label={strings.appointments.otherSpecialtyLabel}
            value={otherSpecialty}
            onChangeText={(v) => {
              setSaved(false);
              setOtherSpecialty(v);
            }}
          />
        ) : null}
        <Input
          label={strings.appointments.doctorLabel}
          value={doctor}
          onChangeText={(v) => {
            setSaved(false);
            setDoctor(v);
          }}
        />
        <DateTimeField
          dateValue={dateStr}
          timeValue={timeStr}
          onChangeDate={setDateStr}
          onChangeTime={setTimeStr}
        />
        <Button label={strings.appointments.save} onPress={save} disabled={!valid} />
        {saved ? (
          <AppText variant="caption" style={{ color: colors.success }}>
            {strings.appointments.savedLabel}
          </AppText>
        ) : null}
        <AppText variant="caption" muted>
          {strings.appointments.remindersNote}
        </AppText>
      </Card>

      {upcoming.length > 0 ? (
        <Card>
          <AppText variant="title">{strings.appointments.upcoming}</AppText>
          {upcoming.map(row)}
        </Card>
      ) : null}
      {past.length > 0 ? (
        <Card>
          <AppText variant="title">{strings.appointments.past}</AppText>
          {past.map(row)}
        </Card>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
