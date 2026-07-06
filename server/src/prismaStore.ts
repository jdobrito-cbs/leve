import type { PrismaClient } from '@prisma/client';
import type { BackupRecord, ConsentRecord, Store, UserRecord } from './store.js';

export class PrismaStore implements Store {
  constructor(private prisma: PrismaClient) {}

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
