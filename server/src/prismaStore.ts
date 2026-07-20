import type { PrismaClient } from '@prisma/client';
import type {
  AdminPatch,
  AdminRecord,
  AdminRole,
  AdminStore,
  BackupRecord,
  ConsentRecord,
  PartnerKeyRecord,
  PartnerKeyStore,
  Store,
  UserRecord,
} from './store.js';

export class PrismaStore implements Store, PartnerKeyStore, AdminStore {
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
    };
  }

  async createPartnerKey(
    label: string,
    keyHash: string,
    hint: string,
    keyEnc: string | null = null,
  ): Promise<PartnerKeyRecord> {
    const k = await this.prisma.partnerKey.create({ data: { label, keyHash, hint, keyEnc } });
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
    // Só prende se ainda estiver livre e ativa (condição na cláusula where).
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

  async createUser(email: string, passwordHash: string): Promise<UserRecord> {
    const u = await this.prisma.user.create({ data: { email, passwordHash } });
    return { id: u.id, email: u.email, passwordHash: u.passwordHash };
  }
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
  async findUserById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  }
  async findRefreshToken(tokenHash: string) {
    const r = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    return r ? { userId: r.userId, expiresAt: r.expiresAt, revokedAt: r.revokedAt } : null;
  }
  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  async setConsent(userId: string, kind: string, granted: boolean): Promise<void> {
    const now = new Date();
    await this.prisma.consent.upsert({
      where: { userId_kind: { userId, kind } },
      create: { userId, kind, grantedAt: now, revokedAt: granted ? null : now },
      update: granted ? { grantedAt: now, revokedAt: null } : { revokedAt: now },
    });
  }
  async listConsents(userId: string): Promise<ConsentRecord[]> {
    const rows = await this.prisma.consent.findMany({ where: { userId } });
    return rows.map((c) => ({
      kind: c.kind,
      grantedAt: c.grantedAt.toISOString(),
      revokedAt: c.revokedAt ? c.revokedAt.toISOString() : null,
    }));
  }

  async putBackup(userId: string, blob: string): Promise<void> {
    await this.prisma.backup.upsert({
      where: { userId },
      create: { userId, blob, size: blob.length },
      update: { blob, size: blob.length },
    });
  }
  async getBackup(userId: string): Promise<BackupRecord | null> {
    const b = await this.prisma.backup.findUnique({ where: { userId } });
    return b ? { blob: b.blob, size: b.size, updatedAt: b.updatedAt.toISOString() } : null;
  }
}
