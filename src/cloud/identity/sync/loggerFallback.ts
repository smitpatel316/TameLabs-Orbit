export const logger = {
  info: (tag: string, msg: string, data?: any) => {
    try { console.log(`[cloud:${tag}] ${msg}`, data||''); } catch {}
  },
  event: (ev: string, data?: any) => {
    try { console.log(`[cloud:event] ${ev}`, data||''); } catch {}
  }
};
