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

export interface PartnerKeyRecord {
  id: string;
  keyHash: string;
  hint: string;
  label: string;
  createdAt: string;
  revokedAt: string | null;
  boundDeviceId: string | null;
  boundAt: string | null;
  keyEnc: string | null;
  expiresAt: string | null;
}

export interface PartnerKeyStore {
  createPartnerKey(
    label: string,
    keyHash: string,
    hint: string,
    keyEnc?: string | null,
    expiresAt?: string | null,
  ): Promise<PartnerKeyRecord>;
  listPartnerKeys(): Promise<PartnerKeyRecord[]>;
  findPartnerKeyByHash(keyHash: string): Promise<PartnerKeyRecord | null>;
  revokePartnerKey(id: string): Promise<boolean>;
  bindPartnerKey(id: string, deviceId: string): Promise<boolean>;
  unbindPartnerKey(id: string): Promise<boolean>;
  deletePartnerKey(id: string): Promise<boolean>;
}

export type AdminRole = 'master' | 'admin';

export interface AdminRecord {
  id: string;
  username: string;
  role: AdminRole;
  passwordHash: string;
  totpSecretEnc: string | null;
  totpEnabled: boolean;
  backupCodeHashes: string[];
  tokenVersion: number;
  failedAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
}

export type AdminPatch = Partial<
  Pick<
    AdminRecord,
    | 'passwordHash'
    | 'totpSecretEnc'
    | 'totpEnabled'
    | 'backupCodeHashes'
    | 'tokenVersion'
    | 'failedAttempts'
    | 'lockedUntil'
  >
>;

export interface AdminStore {
  countAdmins(): Promise<number>;
  createAdmin(rec: Omit<AdminRecord, 'id' | 'createdAt'>): Promise<AdminRecord>;
  listAdmins(): Promise<AdminRecord[]>;
  findAdminByUsername(username: string): Promise<AdminRecord | null>;
  findAdminById(id: string): Promise<AdminRecord | null>;
  updateAdmin(id: string, patch: AdminPatch): Promise<AdminRecord | null>;
  deleteAdmin(id: string): Promise<boolean>;
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

export class MemoryStore implements Store, PartnerKeyStore, AdminStore {
  private partnerKeys = new Map<string, PartnerKeyRecord>();
  private pkSeq = 0;

  async createPartnerKey(
    label: string,
    keyHash: string,
    hint: string,
    keyEnc: string | null = null,
    expiresAt: string | null = null,
  ): Promise<PartnerKeyRecord> {
    const record: PartnerKeyRecord = {
      id: `pk${++this.pkSeq}`,
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
    this.partnerKeys.set(record.id, record);
    return record;
  }
  async listPartnerKeys() {
    return [...this.partnerKeys.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  async findPartnerKeyByHash(keyHash: string) {
    return [...this.partnerKeys.values()].find((k) => k.keyHash === keyHash) ?? null;
  }
  async revokePartnerKey(id: string) {
    const record = this.partnerKeys.get(id);
    if (!record || record.revokedAt) return false;
    record.revokedAt = new Date().toISOString();
    return true;
  }
  async bindPartnerKey(id: string, deviceId: string) {
    const record = this.partnerKeys.get(id);
    if (!record || record.revokedAt || record.boundDeviceId) return false;
    record.boundDeviceId = deviceId;
    record.boundAt = new Date().toISOString();
    return true;
  }
  async unbindPartnerKey(id: string) {
    const record = this.partnerKeys.get(id);
    if (!record || !record.boundDeviceId) return false;
    record.boundDeviceId = null;
    record.boundAt = null;
    return true;
  }
  async deletePartnerKey(id: string) {
    const record = this.partnerKeys.get(id);
    if (!record || !record.revokedAt) return false;
    return this.partnerKeys.delete(id);
  }

  private admins = new Map<string, AdminRecord>();
  private adminSeq = 0;

  async countAdmins() {
    return this.admins.size;
  }
  async createAdmin(rec: Omit<AdminRecord, 'id' | 'createdAt'>): Promise<AdminRecord> {
    if ([...this.admins.values()].some((a) => a.username === rec.username)) {
      throw new Error('usuário já existe');
    }
    const admin: AdminRecord = { ...rec, id: `a${++this.adminSeq}`, createdAt: new Date().toISOString() };
    this.admins.set(admin.id, admin);
    return admin;
  }
  async listAdmins() {
    return [...this.admins.values()].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  }
  async findAdminByUsername(username: string) {
    return [...this.admins.values()].find((a) => a.username === username) ?? null;
  }
  async findAdminById(id: string) {
    return this.admins.get(id) ?? null;
  }
  async updateAdmin(id: string, patch: AdminPatch) {
    const admin = this.admins.get(id);
    if (!admin) return null;
    Object.assign(admin, patch);
    return admin;
  }
  async deleteAdmin(id: string) {
    return this.admins.delete(id);
  }

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
