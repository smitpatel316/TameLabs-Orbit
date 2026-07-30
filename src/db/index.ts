import * as SQLite from 'expo-sqlite';
let dbInstance: SQLite.SQLiteDatabase | null = null;
export const initDb = async () => {
  const d = await SQLite.openDatabaseAsync('orbit.db');
  await d.execAsync(`
    CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, json TEXT);
    CREATE TABLE IF NOT EXISTS interactions (id TEXT PRIMARY KEY, json TEXT);
    CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY, json TEXT);
  `);
  dbInstance = d;
  return d;
};
export const getDb = async () => dbInstance || await initDb();
