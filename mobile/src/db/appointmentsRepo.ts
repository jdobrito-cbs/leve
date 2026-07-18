import { asc, eq } from 'drizzle-orm';
import type { AppDb } from './client';
import { appointments } from './schema';

export interface Appointment {
  id: number;
  place: string;
  specialty: string;
  doctor: string | null;
  scheduledAt: string;
}

export interface AddAppointmentInput {
  place: string;
  specialty: string;
  doctor?: string | null;
  at: Date;
}

export async function addAppointment(db: AppDb, input: AddAppointmentInput): Promise<void> {
  await db.insert(appointments).values({
    place: input.place,
    specialty: input.specialty,
    doctor: input.doctor ?? null,
    scheduledAt: input.at.toISOString(),
  });
}

/** Todas as consultas, das mais próximas às mais distantes. */
export async function listAppointments(db: AppDb, limit = 100): Promise<Appointment[]> {
  return (await db
    .select()
    .from(appointments)
    .orderBy(asc(appointments.scheduledAt))
    .limit(limit)) as Appointment[];
}

export async function deleteAppointment(db: AppDb, id: number): Promise<void> {
  await db.delete(appointments).where(eq(appointments.id, id));
}
