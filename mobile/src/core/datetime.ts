export function dayRangeUtc(date: Date): { startIso: string; endIso: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function lastNDays(n: number, today: Date): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export function formatDateBR(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

export function formatTimeHM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function parseDateTimeBR(dateStr: string, timeStr: string): Date | null {
  const dm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr.trim());
  const tm = /^(\d{2}):(\d{2})$/.exec(timeStr.trim());
  if (!dm || !tm) return null;
  const [, dd, mm, yyyy] = dm.map(Number);
  const [, hh, min] = tm.map(Number);
  const date = new Date(yyyy, mm - 1, dd, hh, min);
  if (
    date.getDate() !== dd ||
    date.getMonth() !== mm - 1 ||
    date.getHours() !== hh ||
    date.getMinutes() !== min
  ) {
    return null;
  }
  return date;
}

export function ageFromIsoDate(iso: string, today: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export function isoDateToBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

export function brDateToIso(br: string): string | null {
  const date = parseDateTimeBR(br, '00:00');
  return date ? localDayKey(date) : null;
}

export function formatDateTimeShort(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month} ${formatTimeHM(d)}`;
}

export function formatDateTimeLabel(iso: string): string {
  const d = new Date(iso);
  return `${formatDateBR(d)} · ${formatTimeHM(d)}`;
}

export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
