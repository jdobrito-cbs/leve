import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { PartnerKeyRecord, PartnerKeyStore } from './store.js';

/**
 * Chaves de parceiro em arquivo JSON — permite rodar o painel sem banco de
 * dados. Com DATABASE_URL configurado, o Prisma assume no lugar deste store.
 */
export class FilePartnerKeyStore implements PartnerKeyStore {
  constructor(private path: string) {
    mkdirSync(dirname(path), { recursive: true });
  }

  private load(): PartnerKeyRecord[] {
    try {
      return JSON.parse(readFileSync(this.path, 'utf8')) as PartnerKeyRecord[];
    } catch {
      return [];
    }
  }

  private save(all: PartnerKeyRecord[]): void {
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, JSON.stringify(all, null, 2), 'utf8');
    renameSync(tmp, this.path);
  }

  async createPartnerKey(label: string, keyHash: string, hint: string): Promise<PartnerKeyRecord> {
    const all = this.load();
    const record: PartnerKeyRecord = {
      id: randomUUID(),
      keyHash,
      hint,
      label,
      createdAt: new Date().toISOString(),
      revokedAt: null,
    };
    all.push(record);
    this.save(all);
    return record;
  }

  async listPartnerKeys(): Promise<PartnerKeyRecord[]> {
    return this.load().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async findPartnerKeyByHash(keyHash: string): Promise<PartnerKeyRecord | null> {
    return this.load().find((k) => k.keyHash === keyHash) ?? null;
  }

  async revokePartnerKey(id: string): Promise<boolean> {
    const all = this.load();
    const record = all.find((k) => k.id === id);
    if (!record || record.revokedAt) return false;
    record.revokedAt = new Date().toISOString();
    this.save(all);
    return true;
  }
}
