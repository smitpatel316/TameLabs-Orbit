export const theme = {
  colors: {
    background: '#0F1117',
    surface: '#1A1D27',
    surfaceHover: '#262A38',
    surfaceActive: '#2D3243',
    border: '#2D3243',
    
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    
    primary: '#E53E3E',
    primaryDark: '#C53030',
    primaryLight: '#FFB3B3',
    
    success: '#38A169',
    warning: '#D69E2E',
    danger: '#E53E3E',
    
    blue: '#3182CE',
    pink: '#D53F8C',
  },
  spacing: { 
    xs: 4, 
    s: 8, 
    m: 16, 
    l: 24, 
    xl: 32, 
    xxl: 48 
  },
  borderRadius: { 
    s: 6, 
    m: 10, 
    l: 14, 
    full: 9999 
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const },
    h2: { fontSize: 24, fontWeight: '600' as const },
    h3: { fontSize: 20, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    caption: { fontSize: 14, fontWeight: '400' as const },
    label: { fontSize: 12, fontWeight: '500' as const },
  },
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  }
};

export const RELATIONSHIP_COLORS: Record<string, string> = {
  family: '#E53E3E',
  friend: '#3182CE',
  professional: '#D69E2E',
  romantic: '#D53F8C',
  acquaintance: '#718096',
};

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

