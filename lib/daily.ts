// Argentina is UTC-3, no DST. We compute the "current" date by shifting now -3h
// and reading the UTC date — this gives a stable date boundary at 00:00 ART.

const AR_OFFSET_MS = -3 * 60 * 60 * 1000;

export function argentinaNow(): Date {
  return new Date(Date.now() + AR_OFFSET_MS);
}

/** YYYY-MM-DD in Argentina time. */
export function argentinaDateISO(d: Date = argentinaNow()): string {
  return d.toISOString().slice(0, 10);
}

/** 0=Sun … 6=Sat — in Argentina time. */
export function argentinaWeekday(d: Date = argentinaNow()): number {
  return d.getUTCDay();
}

export function isWeekend(d: Date = argentinaNow()): boolean {
  const w = argentinaWeekday(d);
  return w === 0 || w === 6;
}

/** Long Spanish header, e.g. "Jueves · 7 mayo 2026 · Día 142". */
export function formatHeaderDate(d: Date = argentinaNow()): string {
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((d.getTime() - start) / 86400000);
  return `${days[d.getUTCDay()]} · ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} · Día ${dayOfYear}`;
}

/** Short tile date, e.g. "07 MAY". */
export function formatTileDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  return `${String(d.getUTCDate()).padStart(2, '0')} ${months[d.getUTCMonth()]}`;
}

/**
 * Deterministic character pick for a given Argentina date.
 * Same date → same character for everyone, no DB row needed.
 */
export function pickCharacterIndex(dateISO: string, total: number): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < dateISO.length; i++) {
    h ^= dateISO.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % total;
}
