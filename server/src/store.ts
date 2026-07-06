export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
}

export interface ConsentRecord {
  kind: string;
  grantedAt: string;
  revokedAt: string | null;
}

export interface BackupRecord {
  blob: string;
  size: number;
  updatedAt: string;
}

export interface Store {
  createUser(email: string, passwordHash: string): Promise<UserRecord>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  deleteUser(id: string): Promise<void>;

  saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findRefreshToken(tokenHash: string): Promise<{ userId: string; expiresAt: Date; revokedAt: Date | null } | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;

  setConsent(userId: string, kind: string, granted: boolean): Promise<void>;
  listConsents(userId: string): Promise<ConsentRecord[]>;

  putBackup(userId: string, blob: string): Promise<void>;
  getBackup(userId: string): Promise<BackupRecord | null>;
}

/** Store em memória — usado nos testes e como referência da interface. */
export class MemoryStore implements Store {
  private users = new Map<string, UserRecord>();
  private refresh = new Map<string, { userId: string; expiresAt: Date; revokedAt: Date | null }>();
  private consents = new Map<string, Map<string, ConsentRecord>>();
  private backups = new Map<string, BackupRecord>();
  private seq = 0;

  async createUser(email: string, passwordHash: string): Promise<UserRecord> {
    if ([...this.users.values()].some((u) => u.email === email)) {
      throw new Error('email já cadastrado');
    }
    const user = { id: `u${++this.seq}`, email, passwordHash };
    this.users.set(user.id, user);
    return user;
  }
  async findUserByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }
  async findUserById(id: string) {
    return this.users.get(id) ?? null;
  }
  async deleteUser(id: string) {
    this.users.delete(id);
    this.backups.delete(id);
    this.consents.delete(id);
    for (const [hash, r] of this.refresh) if (r.userId === id) this.refresh.delete(hash);
  }

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    this.refresh.set(tokenHash, { userId, expiresAt, revokedAt: null });
  }
  async findRefreshToken(tokenHash: string) {
    return this.refresh.get(tokenHash) ?? null;
  }
  async revokeRefreshToken(tokenHash: string) {
    const r = this.refresh.get(tokenHash);
    if (r) r.revokedAt = new Date();
  }

  async setConsent(userId: string, kind: string, granted: boolean) {
    const map = this.consents.get(userId) ?? new Map<string, ConsentRecord>();
    map.set(kind, {
      kind,
      grantedAt: new Date().toISOString(),
      revokedAt: granted ? null : new Date().toISOString(),
    });
    this.consents.set(userId, map);
  }
  async listConsents(userId: string) {
    return [...(this.consents.get(userId)?.values() ?? [])];
  }

  async putBackup(userId: string, blob: string) {
    this.backups.set(userId, { blob, size: blob.length, updatedAt: new Date().toISOString() });
  }
  async getBackup(userId: string) {
    return this.backups.get(userId) ?? null;
  }
}
