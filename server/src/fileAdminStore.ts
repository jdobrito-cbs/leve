import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { AdminPatch, AdminRecord, AdminStore } from './store.js';

/**
 * Administradores do painel em arquivo JSON — permite login + 2FA sem banco de
 * dados. Com DATABASE_URL configurado, o Prisma assume no lugar deste store.
 * As senhas ficam como hash scrypt e o segredo TOTP cifrado (nunca em claro).
 */
export class FileAdminStore implements AdminStore {
  constructor(private path: string) {
    mkdirSync(dirname(path), { recursive: true });
  }

  private load(): AdminRecord[] {
    try {
      return JSON.parse(readFileSync(this.path, 'utf8')) as AdminRecord[];
    } catch {
      return [];
    }
  }

  private save(all: AdminRecord[]): void {
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, JSON.stringify(all, null, 2), 'utf8');
    renameSync(tmp, this.path);
  }

  async countAdmins(): Promise<number> {
    return this.load().length;
  }

  async createAdmin(rec: Omit<AdminRecord, 'id' | 'createdAt'>): Promise<AdminRecord> {
    const all = this.load();
    if (all.some((a) => a.username === rec.username)) throw new Error('usuário já existe');
    const admin: AdminRecord = { ...rec, id: randomUUID(), createdAt: new Date().toISOString() };
    all.push(admin);
    this.save(all);
    return admin;
  }

  async listAdmins(): Promise<AdminRecord[]> {
    return this.load().sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  }

  async findAdminByUsername(username: string): Promise<AdminRecord | null> {
    return this.load().find((a) => a.username === username) ?? null;
  }

  async findAdminById(id: string): Promise<AdminRecord | null> {
    return this.load().find((a) => a.id === id) ?? null;
  }

  async updateAdmin(id: string, patch: AdminPatch): Promise<AdminRecord | null> {
    const all = this.load();
    const admin = all.find((a) => a.id === id);
    if (!admin) return null;
    Object.assign(admin, patch);
    this.save(all);
    return admin;
  }

  async deleteAdmin(id: string): Promise<boolean> {
    const all = this.load();
    const next = all.filter((a) => a.id !== id);
    if (next.length === all.length) return false;
    this.save(next);
    return true;
  }
}
