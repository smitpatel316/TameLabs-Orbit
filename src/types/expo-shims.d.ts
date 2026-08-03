declare module 'expo-file-system' {
  export const documentDirectory: string;
  export function writeAsStringAsync(uri: string, content: string, options?: any): Promise<void>;
  export const EncodingType: any;
}
declare module 'expo-sharing' {
  export function shareAsync(uri: string, options?: any): Promise<void>;
  export function isAvailableAsync(): Promise<boolean>;
}
declare module 'expo-document-picker' {
  export function getDocumentAsync(options?: any): Promise<any>;
}
declare module 'expo-contacts' {
  export const Fields: any;
  export function requestPermissionsAsync(): Promise<any>;
  export function getContactsAsync(options?: any): Promise<any>;
}
declare module 'expo-calendar' {
  export function requestCalendarPermissionsAsync(): Promise<any>;
  export function getCalendarsAsync(): Promise<any>;
}
declare module 'expo-sqlite' {
  export type SQLiteDatabase = any;
  export function openDatabaseAsync(name: string): Promise<any>;
  export function openDatabaseSync(name: string): any;
}
