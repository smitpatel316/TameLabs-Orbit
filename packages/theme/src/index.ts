export const HEALTH_PALETTE = {
  excellent: '#059669',
  good: '#10B981',
  okay: '#F59E0B',
  poor: '#F97316',
  critical: '#EF4444',
} as const;

export const GROUP_COLORS = [
  '#111827', '#E53E3E', '#3182CE', '#D69E2E',
  '#10B981', '#D53F8C', '#805AD5', '#ED8936',
] as const;

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
] as const;

export const theme = {
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceLight: '#FFFFFF',
    surfaceMuted: '#F9FAFB',
    surfaceHover: '#F3F4F6',
    surfaceActive: '#E5E7EB',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderStrong: '#D1D5DB',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textMuted: '#D1D5DB',
    primary: '#111827',
    onPrimary: '#FFFFFF',
    primaryHover: '#1F2937',
    danger: '#EF4444',
    dangerBg: '#FFF5F5',
    dangerBorder: '#FED7D7',
    dangerText: '#E53E3E',
    success: '#10B981',
    successBg: '#F0FDF4',
    warning: '#F59E0B',
    warningBg: '#FFFBEB',
    warningBorder: '#FDE68A',
    warningText: '#92400E',
    error: '#EF4444',
    accent: '#3B82F6',
    tagBg: '#F3F4F6',
    tagText: '#6B7280',
    circleBadgeBg: '#F3F4F6',
    circleBadgeText: '#6B7280',
    focus: '#111827',
    skeleton: '#F3F4F6',
    skeletonHighlight: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.4)',
    health: HEALTH_PALETTE,
  },
  health: HEALTH_PALETTE,
  spacing: {
    xs: 4,
    s: 8,
    m: 12,
    ml: 16,
    l: 20,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  borderRadius: {
    xs: 6,
    s: 8,
    m: 10,
    ml: 12,
    l: 16,
    xl: 20,
    xxl: 24,
    pill: 999,
    full: 9999,
  },
  typography: {
    display: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.6, lineHeight: 32 },
    h1: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 28 },
    h2: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 24 },
    h3: { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.1, lineHeight: 20 },
    body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
    bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
    micro: { fontSize: 11, lineHeight: 14 },
    label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
    labelSmall: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
    mono: { fontFamily: 'monospace', fontSize: 13 },
  },
  shadows: {
    none: {},
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
    card: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    cardHover: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    chip: { shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    fab: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
    modal: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  },
  sizes: {
    fab: 56,
    avatar: 40,
    iconSmall: 16,
    iconMedium: 20,
    iconLarge: 24,
    tabBar: 56,
  },
};

export const RELATIONSHIP_COLORS: Record<string, string> = {
  family: '#EF4444',
  friend: '#3B82F6',
  professional: '#F59E0B',
  romantic: '#EC4899',
  acquaintance: '#6B7280',
};

export const HUBBLE_CATEGORY_COLORS: Record<string, string> = {
  social: '#E53E3E',
  work: '#3182CE',
  dating: '#D53F8C',
  health: '#38A169',
  finance: '#D69E2E',
  other: '#718096',
} as const;

export function getHealthColor(h: number): string {
  if (h>=80) return theme.health.excellent;
  if (h>=60) return theme.health.good;
  if (h>=40) return theme.health.okay;
  if (h>=20) return theme.health.poor;
  return theme.health.critical;
}

export function getHubbleTierColor(tier: string): string {
  switch(tier) {
    case 'oracle': return '#FFD700';
    case 'sharp': return '#111827';
    case 'calibrated': return '#059669';
    case 'novice': return '#6366F1';
    default: return '#9CA3AF';
  }
}

export function getHubbleTierLabel(brier: number, resolved: number): { tier: string, label: string } {
  if (resolved < 3) return { tier: 'unranked', label: 'Unranked - log 3 predictions to rank' };
  if (brier >= 0.25) return { tier: 'novice', label: `Novice - Brier ${brier.toFixed(3)} (random = 0.25)` };
  if (brier >= 0.18) return { tier: 'calibrated', label: `Calibrated - Brier ${brier.toFixed(3)} beats random` };
  if (brier >= 0.10) return { tier: 'sharp', label: `Sharp - Brier ${brier.toFixed(3)} well-calibrated` };
  return { tier: 'oracle', label: `Oracle - Brier ${brier.toFixed(3)} exceptional` };
}

export function formatTimeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'now';
    const diff = Date.now() - d.getTime();
    const s = Math.floor(diff/1000);
    if (s<5) return 'now';
    if (s<60) return `${s}s`;
    const m=Math.floor(s/60);
    if (m<60) return `${m}m`;
    const h=Math.floor(m/60);
    if (h<24) return `${h}h`;
    const days=Math.floor(h/24);
    if (days===1) return 'yesterday';
    if (days<7) return `${days}d`;
    if (days<30) return `${Math.floor(days/7)}w`;
    if (days<365) return `${Math.floor(days/30)}mo`;
    return `${Math.floor(days/365)}y`;
  } catch { return ''; }
}

export function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return iso.slice(0,10); }
}

export function formatFullDate(iso: string): string {
  try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; }
}
