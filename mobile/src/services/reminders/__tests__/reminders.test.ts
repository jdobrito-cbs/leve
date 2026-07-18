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
