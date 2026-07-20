import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { PartnerKeyRecord, PartnerKeyStore } from './store.js';

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

  async createPartnerKey(
    label: string,
    keyHash: string,
    hint: string,
    keyEnc: string | null = null,
    expiresAt: string | null = null,
  ): Promise<PartnerKeyRecord> {
    const all = this.load();
    const record: PartnerKeyRecord = {
      id: randomUUID(),
      keyHash,
      hint,
      label,
      createdAt: new Date().toISOString(),
      revokedAt: null,
      boundDeviceId: null,
      boundAt: null,
      keyEnc,
      expiresAt,
    };
    all.push(record);
    this.save(all);
    return record;
  }

  async listPartnerKeys(): Promise<PartnerKeyRecord[]> {
    return this.load().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async findPartnerKeyByHash(keyHash: string): Promise<PartnerKeyRecord | null> {
    const found = this.load().find((k) => k.keyHash === keyHash);
    if (!found) return null;
    return {
      ...found,
      boundDeviceId: found.boundDeviceId ?? null,
      boundAt: found.boundAt ?? null,
      keyEnc: found.keyEnc ?? null,
      expiresAt: found.expiresAt ?? null,
    };
  }

  async revokePartnerKey(id: string): Promise<boolean> {
    const all = this.load();
    const record = all.find((k) => k.id === id);
    if (!record || record.revokedAt) return false;
    record.revokedAt = new Date().toISOString();
    this.save(all);
    return true;
  }

  async bindPartnerKey(id: string, deviceId: string): Promise<boolean> {
    const all = this.load();
    const record = all.find((k) => k.id === id);
    if (!record || record.revokedAt || record.boundDeviceId) return false;
    record.boundDeviceId = deviceId;
    record.boundAt = new Date().toISOString();
    this.save(all);
    return true;
  }

  async unbindPartnerKey(id: string): Promise<boolean> {
    const all = this.load();
    const record = all.find((k) => k.id === id);
    if (!record || !record.boundDeviceId) return false;
    record.boundDeviceId = null;
    record.boundAt = null;
    this.save(all);
    return true;
  }

  async deletePartnerKey(id: string): Promise<boolean> {
    const all = this.load();
    const record = all.find((k) => k.id === id);
    if (!record || !record.revokedAt) return false;
    this.save(all.filter((k) => k.id !== id));
    return true;
  }
}
