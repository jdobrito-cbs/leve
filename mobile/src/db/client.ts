import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

export const sqlite = openDatabaseSync('leve.db');
export const db = drizzle(sqlite, { schema });
export type AppDb = typeof db;
