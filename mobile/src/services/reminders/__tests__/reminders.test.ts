const mockSchedule = jest.fn();
const mockCancel = jest.fn();
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (...a: unknown[]) => mockSchedule(...a),
  cancelScheduledNotificationAsync: (...a: unknown[]) => mockCancel(...a),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily' },
}));

import {
  applyAppointmentReminders,
  applyMedicationReminders,
  applyMorningWaterReminder,
  applySleepReminder,
  applyWaterReminders,
  scheduleDoseReminder,
} from '../reminders';

beforeEach(() => {
  mockSchedule.mockClear();
  mockCancel.mockClear();
});

test('dose futura agenda com identifier fixo; passada não agenda', async () => {
  await scheduleDoseReminder(new Date(Date.now() + 86400000));
  expect(mockCancel).toHaveBeenCalledWith('dose-reminder');
  expect(mockSchedule).toHaveBeenCalledWith(
    expect.objectContaining({ identifier: 'dose-reminder' }),
  );
  mockSchedule.mockClear();
  await scheduleDoseReminder(new Date(Date.now() - 1000));
  expect(mockSchedule).not.toHaveBeenCalled();
});

test('consulta futura agenda aviso do dia (08:00) e 3h/2h/1h antes; passada não', async () => {
  const tomorrowNoon = new Date(Date.now() + 86400000);
  tomorrowNoon.setHours(12, 0, 0, 0);
  await applyAppointmentReminders(true, [
    { id: 1, place: 'Clínica Vida', specialty: 'Cardiologia', scheduledAt: tomorrowNoon.toISOString() },
    { id: 2, place: 'HGE', specialty: 'Ortopedia', scheduledAt: new Date(Date.now() - 86400000).toISOString() },
  ]);
  expect(mockCancel).toHaveBeenCalledWith('appt-0');
  expect(mockSchedule).toHaveBeenCalledTimes(4); // dia + 3h + 2h + 1h, só da futura
  expect(mockSchedule).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({ body: 'Cardiologia · Clínica Vida' }),
    }),
  );
  mockSchedule.mockClear();
  await applyAppointmentReminders(false, []);
  expect(mockSchedule).not.toHaveBeenCalled();
});

test('água agenda um DAILY por horário e cancela os antigos', async () => {
  await applyWaterReminders(true, ['09:00', '13:00']);
  expect(mockCancel).toHaveBeenCalledWith('water-0');
  expect(mockSchedule).toHaveBeenCalledTimes(2);
  mockSchedule.mockClear();
  await applyWaterReminders(false, []);
  expect(mockSchedule).not.toHaveBeenCalled();
});

test('hora de dormir e bom dia agendam DAILY no horário; desligado ou inválido não', async () => {
  await applySleepReminder(true, '23:10');
  expect(mockSchedule).toHaveBeenCalledWith(
    expect.objectContaining({
      identifier: 'sleep-reminder',
      trigger: expect.objectContaining({ hour: 23, minute: 10 }),
    }),
  );
  await applyMorningWaterReminder(true, '06:50');
  expect(mockSchedule).toHaveBeenCalledWith(
    expect.objectContaining({
      identifier: 'water-morning',
      trigger: expect.objectContaining({ hour: 6, minute: 50 }),
    }),
  );
  mockSchedule.mockClear();
  await applySleepReminder(false, '23:10');
  await applySleepReminder(true, undefined);
  await applyMorningWaterReminder(true, '25h77');
  expect(mockSchedule).not.toHaveBeenCalled();
});

test('remédios: agenda por horário quando ligado; desligado só cancela', async () => {
  const meds = [{ id: 1, name: 'Metformina', doseText: '850 mg', times: ['08:00', '20:00'] }];
  await applyMedicationReminders(true, meds);
  expect(mockSchedule).toHaveBeenCalledTimes(2);
  mockSchedule.mockClear();
  await applyMedicationReminders(false, meds);
  expect(mockCancel).toHaveBeenCalledWith('med-0');
  expect(mockSchedule).not.toHaveBeenCalled();
});
