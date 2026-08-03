import { MONTHS } from '../theme';
export function formatDate(iso: string | null): string {
  if (!iso) return 'never';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'never';
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch { return 'never'; }
}
export function formatTimeAgo(iso: string | null): string {
  if (!iso) return 'never';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff/60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins/60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs/24);
    if (days < 30) return `${days}d ago`;
    const mo = Math.floor(days/30);
    return `${mo}mo ago`;
  } catch { return 'never'; }
}
