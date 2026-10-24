/* ============================================================
   Shared progress for parts that had no save of their own
   (the mini-games, Max's Footprints), read by the Explorer
   Passport (passport.html). Stored on this device only.
     maxprogress.v1 = { pirates:{rounds}, flood:{cleared}, footprints:{seen:[…], total} }
   ============================================================ */
export const PROGRESS_KEY = 'maxprogress.v1';

export function readProgress(){
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch (e) { return {}; }
}
function write(p){ try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {} }

/* count something up: bump('pirates', 'rounds') */
export function bump(part, field, by = 1){
  const p = readProgress(), o = p[part] || (p[part] = {});
  o[field] = (o[field] || 0) + by; write(p);
}
/* remember that one item was seen: seen('footprints', 'seoul', 16) */
export function seen(part, id, total){
  const p = readProgress(), o = p[part] || (p[part] = {});
  const s = new Set(o.seen || []); s.add(id); o.seen = [...s];
  if (total) o.total = total;
  write(p);
}
