/**
 * TameLabs Prod Logger - local-first, zero tracking, daily rotation
 * Stores up to 500 entries in AsyncStorage, exports JSONL for nightly bugfix cron
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

async function load() {
  if (initialized) return;
  try {
    const raw = Promise.resolve(localStorage.getItem(STORAGE_KEY))
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) memoryLogs = parsed.slice(-MAX_ENTRIES);
    }
  } catch {}
  initialized = true;
}

async function persist() {
  try {
    const toSave = memoryLogs.slice(-MAX_ENTRIES);
    Promise.resolve(localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)))
  } catch {}
}

function format(entry: LogEntry): string {
  const d = entry.data ? ` | ${JSON.stringify(entry.data).slice(0,500)}` : '';
  const s = entry.stack ? `\n${entry.stack.slice(0,600)}` : '';
  return `[${entry.ts}] ${entry.level.toUpperCase()} ${entry.tag}: ${entry.msg}${d}${s}`;
}

function makeEntry(level: LogLevel, tag: string, msg: string, data?: any, stack?: string): LogEntry {
  return {
    ts: new Date().toISOString(),
    level,
    tag,
    msg,
    data,
    stack,
  };
}

function push(entry: LogEntry) {
  memoryLogs.push(entry);
  if (memoryLogs.length > MAX_ENTRIES) memoryLogs = memoryLogs.slice(-MAX_ENTRIES);
  persist().catch(()=>{});
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const fn = entry.level==='error' ? console.error : entry.level==='warn' ? console.warn : console.log;
    fn(format(entry));
  } else if (entry.level==='error' || entry.level==='warn') {
    (entry.level==='error' ? console.error : console.warn)(format(entry));
  }
}

export const logger = {
  async init() { await load(); },
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
    await load();
    let list = [...memoryLogs];
    if (filter?.level) list = list.filter(l=>l.level===filter.level);
    if (filter?.tag) list = list.filter(l=>l.tag===filter.tag);
    if (filter?.since) list = list.filter(l=>l.ts >= filter.since!);
    return list;
  },
  async getErrors(): Promise<LogEntry[]> {
    await load();
    return memoryLogs.filter(l=>l.level==='error');
  },
  exportLogs(): string { return JSON.stringify(memoryLogs, null, 2); },
  exportJSONL(): string { return memoryLogs.map(l=>JSON.stringify(l)).join('\n'); },
  async clear() {
    memoryLogs = [];
    try { Promise.resolve(localStorage.removeItem(STORAGE_KEY)) } catch {}
  },
  async exportForDay(dateStr: string): Promise<string> {
    await load();
    const dayLogs = memoryLogs.filter(l=>l.ts.startsWith(dateStr));
    return dayLogs.map(l=>JSON.stringify(l)).join('\n');
  },
  _memory: () => memoryLogs,
};
