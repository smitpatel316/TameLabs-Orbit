/**
 * Web shim for TameLabs logger - uses localStorage sync
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogEntry = {
  ts: string;
  level: LogLevel;
  tag: string;
  msg: string;
  data?: any;
  stack?: string;
};

const STORAGE_KEY = 'tamelabs-logs-v1';
const MAX_ENTRIES = 500;

let memoryLogs: LogEntry[] = [];
let initialized = false;

function safeLoad(): LogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(-MAX_ENTRIES);
    }
  } catch {}
  return [];
}

function safeSave(logs: LogEntry[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-MAX_ENTRIES))); } catch {}
}

function format(entry: LogEntry): string {
  const d = entry.data ? ` | ${JSON.stringify(entry.data).slice(0,500)}` : '';
  const s = entry.stack ? `\n${entry.stack.slice(0,600)}` : '';
  return `[${entry.ts}] ${entry.level.toUpperCase()} ${entry.tag}: ${entry.msg}${d}${s}`;
}

function makeEntry(level: LogLevel, tag: string, msg: string, data?: any, stack?: string): LogEntry {
  return { ts: new Date().toISOString(), level, tag, msg, data, stack };
}

function push(entry: LogEntry) {
  if (!initialized) { memoryLogs = safeLoad(); initialized = true; }
  memoryLogs.push(entry);
  if (memoryLogs.length > MAX_ENTRIES) memoryLogs = memoryLogs.slice(-MAX_ENTRIES);
  safeSave(memoryLogs);
  // eslint-disable-next-line no-console
  if (entry.level==='error') console.error(format(entry));
  else if (entry.level==='warn') console.warn(format(entry));
}

export const logger = {
  async init() { if(!initialized){ memoryLogs = safeLoad(); initialized=true; } },
  debug(tag: string, msg: string, data?: any) { push(makeEntry('debug', tag, msg, data)); },
  info(tag: string, msg: string, data?: any) { push(makeEntry('info', tag, msg, data)); },
  warn(tag: string, msg: string, data?: any) { push(makeEntry('warn', tag, msg, data)); },
  error(tag: string, msg: string, data?: any) {
    const stack = data instanceof Error ? data.stack : (data?.stack || undefined);
    const d = data instanceof Error ? { name: data.name, message: data.message } : data;
    push(makeEntry('error', tag, msg, d, stack));
  },
  logError(err: any, context?: any) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    const tag = context?.screen || context?.tag || 'unhandled';
    const entry = makeEntry('error', tag, msg, { context, name: err?.name }, stack);
    push(entry);
  },
  event(name: string, props?: any) { push(makeEntry('info', 'event', name, props)); },
  async getLogs(filter?: { level?: LogLevel; tag?: string; since?: string }): Promise<LogEntry[]> {
    if(!initialized){ memoryLogs = safeLoad(); initialized=true; }
    let list=[...memoryLogs];
    if (filter?.level) list=list.filter(l=>l.level===filter.level);
    if (filter?.tag) list=list.filter(l=>l.tag===filter.tag);
    if (filter?.since) list=list.filter(l=>l.ts>=filter.since!);
    return list;
  },
  async getErrors(): Promise<LogEntry[]> {
    if(!initialized){ memoryLogs = safeLoad(); initialized=true; }
    return memoryLogs.filter(l=>l.level==='error');
  },
  exportLogs(): string { if(!initialized) memoryLogs=safeLoad(); return JSON.stringify(memoryLogs, null, 2); },
  exportJSONL(): string { if(!initialized) memoryLogs=safeLoad(); return memoryLogs.map(l=>JSON.stringify(l)).join('\n'); },
  async clear() { memoryLogs=[]; if(typeof window!=='undefined') try{ localStorage.removeItem(STORAGE_KEY); }catch{} },
  async exportForDay(dateStr: string): Promise<string> {
    if(!initialized) memoryLogs=safeLoad();
    return memoryLogs.filter(l=>l.ts.startsWith(dateStr)).map(l=>JSON.stringify(l)).join('\n');
  },
  _memory: () => { if(!initialized) memoryLogs=safeLoad(); return memoryLogs; },
};
