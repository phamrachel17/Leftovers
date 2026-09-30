const DAY = 24 * 60 * 60 * 1000;

export function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(iso: string | Date, days: number): string {
  const d = startOfDay(typeof iso === 'string' ? new Date(iso) : iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function todayIso(): string {
  return startOfDay().toISOString();
}

/** Whole days from today until the date (negative = past). */
export function daysUntil(iso: string): number {
  return Math.round((startOfDay(new Date(iso)).getTime() - startOfDay().getTime()) / DAY);
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function todayLine(): string {
  const d = new Date();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  return `${weekday} · ${shortDate(d.toISOString())}`;
}

/** Gentle, estimate-flavored wording. Never "EXPIRED!!!". */
export function freshnessLabel(iso: string): string {
  const n = daysUntil(iso);
  if (n < 0) return 'past its best?';
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n <= 14) return `~${n} days`;
  return `~${shortDate(iso)}`;
}

export function isEatSoon(iso: string): boolean {
  return daysUntil(iso) <= 3;
}

/** 0 → added, 1 → best-by. Used for the little timeline. */
export function lifeProgress(addedIso: string, bestIso: string): number {
  const start = startOfDay(new Date(addedIso)).getTime();
  const end = startOfDay(new Date(bestIso)).getTime();
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (startOfDay().getTime() - start) / (end - start)));
}
