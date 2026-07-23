import type { PrismaClient } from '@prisma/client';
import type {
  AdminPatch,
  AdminRecord,
  AdminRole,
  AdminStore,
  PartnerKeyRecord,
  PartnerKeyStore,
} from './store.js';

export class PrismaStore implements PartnerKeyStore, AdminStore {
  constructor(private prisma: PrismaClient) {}

  private toPartnerRecord(k: {
    id: string;
    keyHash: string;
    hint: string;
    label: string;
    createdAt: Date;
    revokedAt: Date | null;
    boundDeviceId: string | null;
    boundAt: Date | null;
    keyEnc: string | null;
    expiresAt: Date | null;
  }): PartnerKeyRecord {
    return {
      id: k.id,
      keyHash: k.keyHash,
      hint: k.hint,
      label: k.label,
      createdAt: k.createdAt.toISOString(),
      revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
      boundDeviceId: k.boundDeviceId,
      boundAt: k.boundAt ? k.boundAt.toISOString() : null,
      keyEnc: k.keyEnc,
      expiresAt: k.expiresAt ? k.expiresAt.toISOString() : null,
    };
  }

  async createPartnerKey(
    label: string,
    keyHash: string,
    hint: string,
    keyEnc: string | null = null,
    expiresAt: string | null = null,
  ): Promise<PartnerKeyRecord> {
    const k = await this.prisma.partnerKey.create({
      data: { label, keyHash, hint, keyEnc, expiresAt: expiresAt ? new Date(expiresAt) : null },
    });
    return this.toPartnerRecord(k);
  }
  async listPartnerKeys(): Promise<PartnerKeyRecord[]> {
    const rows = await this.prisma.partnerKey.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((k) => this.toPartnerRecord(k));
  }
  async findPartnerKeyByHash(keyHash: string): Promise<PartnerKeyRecord | null> {
    const k = await this.prisma.partnerKey.findUnique({ where: { keyHash } });
    return k ? this.toPartnerRecord(k) : null;
  }
  async revokePartnerKey(id: string): Promise<boolean> {
    const updated = await this.prisma.partnerKey.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return updated.count > 0;
  }
  async bindPartnerKey(id: string, deviceId: string): Promise<boolean> {
    const updated = await this.prisma.partnerKey.updateMany({
      where: { id, revokedAt: null, boundDeviceId: null },
      data: { boundDeviceId: deviceId, boundAt: new Date() },
    });
    return updated.count > 0;
  }
  async unbindPartnerKey(id: string): Promise<boolean> {
    const updated = await this.prisma.partnerKey.updateMany({
      where: { id, NOT: { boundDeviceId: null } },
      data: { boundDeviceId: null, boundAt: null },
    });
    return updated.count > 0;
  }
  async deletePartnerKey(id: string): Promise<boolean> {
    const deleted = await this.prisma.partnerKey.deleteMany({
      where: { id, NOT: { revokedAt: null } },
    });
    return deleted.count > 0;
  }

  private toAdminRecord(a: {
    id: string;
    username: string;
    role: string;
    passwordHash: string;
    totpSecretEnc: string | null;
    totpEnabled: boolean;
    backupCodeHashes: string[];
    tokenVersion: number;
    failedAttempts: number;
    lockedUntil: Date | null;
    createdAt: Date;
  }): AdminRecord {
    return {
      id: a.id,
      username: a.username,
      role: a.role as AdminRole,
      passwordHash: a.passwordHash,
      totpSecretEnc: a.totpSecretEnc,
      totpEnabled: a.totpEnabled,
      backupCodeHashes: a.backupCodeHashes,
      tokenVersion: a.tokenVersion,
      failedAttempts: a.failedAttempts,
      lockedUntil: a.lockedUntil ? a.lockedUntil.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
    };
  }

  async countAdmins(): Promise<number> {
    return this.prisma.adminUser.count();
  }
  async createAdmin(rec: Omit<AdminRecord, 'id' | 'createdAt'>): Promise<AdminRecord> {
    const a = await this.prisma.adminUser.create({
      data: {
        username: rec.username,
        role: rec.role,
        passwordHash: rec.passwordHash,
        totpSecretEnc: rec.totpSecretEnc,
        totpEnabled: rec.totpEnabled,
        backupCodeHashes: rec.backupCodeHashes,
        tokenVersion: rec.tokenVersion,
        failedAttempts: rec.failedAttempts,
        lockedUntil: rec.lockedUntil ? new Date(rec.lockedUntil) : null,
      },
    });
    return this.toAdminRecord(a);
  }
  async listAdmins(): Promise<AdminRecord[]> {
    const rows = await this.prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map((a) => this.toAdminRecord(a));
  }
  async findAdminByUsername(username: string): Promise<AdminRecord | null> {
    const a = await this.prisma.adminUser.findUnique({ where: { username } });
    return a ? this.toAdminRecord(a) : null;
  }
  async findAdminById(id: string): Promise<AdminRecord | null> {
    const a = await this.prisma.adminUser.findUnique({ where: { id } });
    return a ? this.toAdminRecord(a) : null;
  }
  async updateAdmin(id: string, patch: AdminPatch): Promise<AdminRecord | null> {
    const a = await this.prisma.adminUser.update({
      where: { id },
      data: {
        ...patch,
        lockedUntil:
          patch.lockedUntil === undefined
            ? undefined
            : patch.lockedUntil === null
              ? null
              : new Date(patch.lockedUntil),
      },
    });
    return this.toAdminRecord(a);
  }
  async deleteAdmin(id: string): Promise<boolean> {
    await this.prisma.adminUser.delete({ where: { id } });
    return true;
  }
}
