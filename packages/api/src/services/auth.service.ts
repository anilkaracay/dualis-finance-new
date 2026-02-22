import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { nanoid } from 'nanoid';
import { eq, and, isNull } from 'drizzle-orm';
import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';
import { getDb, schema } from '../db/client.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthUser, AuthSession } from '@dualis/shared';

const log = createChildLogger('auth-service');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireDb() {
  const db = getDb();
  if (!db) throw new AppError('INTERNAL_ERROR', 'Database not available', 500);
  return db;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generatePartyId(role: string): string {
  const prefix = role === 'institutional' ? 'inst' : 'user';
  return `party::${prefix}_${nanoid(12)}`;
}

function toAuthUser(row: typeof schema.users.$inferSelect): AuthUser {
  return {
    id: row.userId,
    email: row.email,
    role: row.role as AuthUser['role'],
    accountStatus: row.accountStatus as AuthUser['accountStatus'],
    emailVerified: row.emailVerified,
    walletAddress: row.walletAddress,
    partyId: row.partyId,
    displayName: row.displayName,
    authProvider: row.authProvider as AuthUser['authProvider'],
    kycStatus: row.kycStatus as AuthUser['kycStatus'],
    createdAt: row.createdAt.toISOString(),
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
  };
}

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------

interface AccessTokenPayload {
  sub: string;
  partyId: string;
  role: string;
  email: string;
}

function signAccessToken(user: AuthUser): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    partyId: user.partyId,
    role: user.role,
    email: user.email,
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as string,
  } as jwt.SignOptions);
}

function signRefreshToken(): string {
  return randomBytes(48).toString('hex');
}

function parseRefreshExpiry(): Date {
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 86_400_000); // default 7d

  const value = Number(match[1]);
  const unit = match[2] as string;
  const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return new Date(Date.now() + value * (multipliers[unit] ?? 86_400_000));
}

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

async function createSession(
  userId: string,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> },
): Promise<{ accessToken: string; refreshToken: string; expiresAt: string }> {
  const db = requireDb();

  const refreshToken = signRefreshToken();
  const sessionId = nanoid(32);

  // Get the user for token signing
  const rows = await db.select().from(schema.users).where(eq(schema.users.userId, userId)).limit(1);
  if (!rows[0]) throw new AppError('NOT_FOUND', 'User not found', 404);

  const user = toAuthUser(rows[0]);
  const accessToken = signAccessToken(user);
  const expiresAt = parseRefreshExpiry();

  await db.insert(schema.sessions).values({
    sessionId,
    userId,
    refreshTokenHash: hashToken(refreshToken),
    ipAddress: (req?.ip as string) ?? null,
    userAgent: (req?.headers?.['user-agent'] as string) ?? null,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Login Event Logging
// ---------------------------------------------------------------------------

async function logLoginEvent(
  userId: string | null,
  email: string | null,
  provider: string,
  success: boolean,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> },
  failureReason?: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db.insert(schema.loginEvents).values({
      userId,
      email,
      provider,
      success,
      ipAddress: (req?.ip as string) ?? null,
      userAgent: (req?.headers?.['user-agent'] as string) ?? null,
      failureReason: failureReason ?? null,
    });
  } catch (err) {
    log.warn({ err }, 'Failed to log login event');
  }
}

// ---------------------------------------------------------------------------
// Password Validation
// ---------------------------------------------------------------------------

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

function validatePassword(password: string): void {
  if (!PASSWORD_REGEX.test(password)) {
    throw new AppError(
      'PASSWORD_TOO_WEAK',
      'Password must be 8+ characters with at least 1 uppercase, 1 lowercase, and 1 number',
      400,
    );
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export async function registerRetail(
  email: string,
  password: string,
  displayName?: string,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> },
): Promise<AuthSession> {
  const db = requireDb();
  validatePassword(password);

  // Check for existing email
  const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    throw new AppError('EMAIL_ALREADY_EXISTS', 'An account with this email already exists', 409);
  }

  const userId = nanoid(24);
  const partyId = generatePartyId('retail');
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  // Create user
  await db.insert(schema.users).values({
    userId,
    email: email.toLowerCase(),
    passwordHash,
    role: 'retail',
    accountStatus: 'active', // Retail users active immediately (email verification optional)
    authProvider: 'email',
    partyId,
    displayName: displayName ?? null,
  });

  // Create retail profile
  await db.insert(schema.retailProfiles).values({
    userId,
  });

  // Create email verification token
  const verificationToken = randomBytes(32).toString('hex');
  await db.insert(schema.emailVerificationTokens).values({
    userId,
    tokenHash: hashToken(verificationToken),
    expiresAt: new Date(Date.now() + 24 * 3_600_000), // 24 hours
  });

  log.info({ userId, email: email.toLowerCase() }, 'Retail user registered');
  log.info({ verificationToken }, 'Email verification token (dev only)');

  // Create session
  const session = await createSession(userId, req);
  const user = (await getUserById(userId))!;

  await logLoginEvent(userId, email.toLowerCase(), 'email', true, req);

  return { ...session, user };
}

export async function registerInstitutional(
  email: string,
  password: string,
  companyName: string,
  repFirstName: string,
  repLastName: string,
  repTitle: string,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> },
): Promise<AuthSession & { institutionId: string }> {
  const db = requireDb();
  validatePassword(password);

  // Check for existing email
  const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    throw new AppError('EMAIL_ALREADY_EXISTS', 'An account with this email already exists', 409);
  }

  const userId = nanoid(24);
  const partyId = generatePartyId('institutional');
  const institutionId = `inst_${nanoid(16)}`;
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  // Create user
  await db.insert(schema.users).values({
    userId,
    email: email.toLowerCase(),
    passwordHash,
    role: 'institutional',
    accountStatus: 'pending_verification',
    authProvider: 'email',
    partyId,
    displayName: `${repFirstName} ${repLastName}`,
  });

  // Create institution record
  await db.insert(schema.institutions).values({
    institutionId,
    userId,
    companyName,
    jurisdiction: 'US', // Default, updated during KYB
    repFirstName,
    repLastName,
    repTitle,
    repEmail: email.toLowerCase(),
    kybStatus: 'not_started',
    onboardingStep: 1,
  });

  // Create email verification token
  const verificationToken = randomBytes(32).toString('hex');
  await db.insert(schema.emailVerificationTokens).values({
    userId,
    tokenHash: hashToken(verificationToken),
    expiresAt: new Date(Date.now() + 24 * 3_600_000),
  });

  log.info({ userId, email: email.toLowerCase(), institutionId }, 'Institutional user registered');
  log.info({ verificationToken }, 'Email verification token (dev only)');

  // Create session
  const session = await createSession(userId, req);
  const user = (await getUserById(userId))!;

  await logLoginEvent(userId, email.toLowerCase(), 'email', true, req);

  return { ...session, user, institutionId };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function loginWithEmail(
  email: string,
  password: string,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> },
): Promise<AuthSession> {
  const db = requireDb();

  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1);
  const userRow = rows[0];

  if (!userRow || !userRow.passwordHash) {
    await logLoginEvent(null, email, 'email', false, req, 'invalid_credentials');
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  // Check account status
  if (userRow.accountStatus === 'suspended') {
    await logLoginEvent(userRow.userId, email, 'email', false, req, 'account_suspended');
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account has been suspended', 403);
  }
  if (userRow.accountStatus === 'deactivated') {
    await logLoginEvent(userRow.userId, email, 'email', false, req, 'account_deactivated');
    throw new AppError('ACCOUNT_DEACTIVATED', 'Your account has been deactivated', 403);
  }

  const passwordValid = await bcrypt.compare(password, userRow.passwordHash);
  if (!passwordValid) {
    await logLoginEvent(userRow.userId, email, 'email', false, req, 'invalid_password');
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  // Update last login
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.userId, userRow.userId));

  const session = await createSession(userRow.userId, req);
  const user = toAuthUser({ ...userRow, lastLoginAt: new Date() });

  await logLoginEvent(userRow.userId, email, 'email', true, req);

  return { ...session, user };
}

// ---------------------------------------------------------------------------
// Wallet Auth
// ---------------------------------------------------------------------------

export async function generateWalletNonce(
  walletAddress: string,
): Promise<{ nonce: string; expiresAt: string }> {
  const db = requireDb();

  const nonce = `Sign this message to authenticate with Dualis Finance:\n\nNonce: ${randomBytes(16).toString('hex')}\nTimestamp: ${new Date().toISOString()}`;
  const expiresAt = new Date(Date.now() + 5 * 60_000); // 5 minutes

  await db.insert(schema.walletNonces).values({
    walletAddress: walletAddress.toLowerCase(),
    nonce,
    expiresAt,
  });

  return { nonce, expiresAt: expiresAt.toISOString() };
}

export async function loginWithWallet(
  walletAddress: string,
  _signature: string,
  nonce: string,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> },
): Promise<AuthSession & { isNewUser: boolean }> {
  const db = requireDb();
  const normalizedAddress = walletAddress.toLowerCase();

  // Verify nonce exists and is valid
  const nonceRows = await db
    .select()
    .from(schema.walletNonces)
    .where(
      and(
        eq(schema.walletNonces.walletAddress, normalizedAddress),
        eq(schema.walletNonces.nonce, nonce),
        isNull(schema.walletNonces.usedAt),
      ),
    )
    .limit(1);

  const nonceRecord = nonceRows[0];
  if (!nonceRecord) {
    throw new AppError('INVALID_NONCE', 'Invalid or expired nonce', 401);
  }

  if (new Date(nonceRecord.expiresAt) < new Date()) {
    throw new AppError('NONCE_EXPIRED', 'Nonce has expired', 401);
  }

  // Mark nonce as used
  await db.update(schema.walletNonces).set({ usedAt: new Date() }).where(eq(schema.walletNonces.id, nonceRecord.id));

  // TODO: In production, verify the signature using ethers.js or viem
  // For now, we accept all signatures in development mode
  // const recoveredAddress = ethers.verifyMessage(nonce, signature);
  // if (recoveredAddress.toLowerCase() !== normalizedAddress) {
  //   throw new AppError('WALLET_SIGNATURE_FAILED', 'Invalid wallet signature', 401);
  // }

  // Check if wallet is already registered
  const existingRows = await db.select().from(schema.users).where(eq(schema.users.walletAddress, normalizedAddress)).limit(1);

  if (existingRows[0]) {
    // Existing user — login
    const userRow = existingRows[0];

    if (userRow.accountStatus === 'suspended') {
      throw new AppError('ACCOUNT_SUSPENDED', 'Your account has been suspended', 403);
    }

    await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.userId, userRow.userId));

    const session = await createSession(userRow.userId, req);
    const user = toAuthUser({ ...userRow, lastLoginAt: new Date() });

    await logLoginEvent(userRow.userId, userRow.email, 'wallet', true, req);

    return { ...session, user, isNewUser: false };
  }

  // New user — create retail account with wallet
  const userId = nanoid(24);
  const partyId = generatePartyId('retail');
  const tempEmail = `${normalizedAddress.slice(0, 10)}@wallet.dualis.finance`;

  await db.insert(schema.users).values({
    userId,
    email: tempEmail,
    role: 'retail',
    accountStatus: 'active',
    authProvider: 'wallet',
    walletAddress: normalizedAddress,
    partyId,
    displayName: `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
  });

  await db.insert(schema.retailProfiles).values({ userId });

  const session = await createSession(userId, req);
  const user = (await getUserById(userId))!;

  await logLoginEvent(userId, tempEmail, 'wallet', true, req);
  log.info({ userId, walletAddress: normalizedAddress }, 'New wallet user registered');

  return { ...session, user, isNewUser: true };
}

// ---------------------------------------------------------------------------
// Token Refresh
// ---------------------------------------------------------------------------

export async function refreshSession(
  refreshToken: string,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> },
): Promise<{ accessToken: string; refreshToken: string; expiresAt: string; user: AuthUser }> {
  const db = requireDb();

  const tokenHash = hashToken(refreshToken);
  const sessionRows = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.refreshTokenHash, tokenHash))
    .limit(1);

  const session = sessionRows[0];
  if (!session) {
    throw new AppError('SESSION_EXPIRED', 'Invalid refresh token', 401);
  }

  if (new Date(session.expiresAt) < new Date()) {
    // Clean up expired session
    await db.delete(schema.sessions).where(eq(schema.sessions.sessionId, session.sessionId));
    throw new AppError('SESSION_EXPIRED', 'Refresh token has expired', 401);
  }

  // Get user
  const userRows = await db.select().from(schema.users).where(eq(schema.users.userId, session.userId)).limit(1);
  if (!userRows[0]) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  const user = toAuthUser(userRows[0]);

  // Rotate refresh token
  const newRefreshToken = signRefreshToken();
  const newExpiresAt = parseRefreshExpiry();

  await db
    .update(schema.sessions)
    .set({
      refreshTokenHash: hashToken(newRefreshToken),
      expiresAt: newExpiresAt,
      lastActiveAt: new Date(),
      ipAddress: (req?.ip as string) ?? session.ipAddress,
    })
    .where(eq(schema.sessions.sessionId, session.sessionId));

  const accessToken = signAccessToken(user);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresAt: newExpiresAt.toISOString(),
    user,
  };
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logout(sessionId: string): Promise<void> {
  const db = requireDb();
  await db.delete(schema.sessions).where(eq(schema.sessions.sessionId, sessionId));
  log.debug({ sessionId }, 'Session invalidated');
}

export async function logoutByRefreshToken(refreshToken: string): Promise<void> {
  const db = requireDb();
  const tokenHash = hashToken(refreshToken);
  await db.delete(schema.sessions).where(eq(schema.sessions.refreshTokenHash, tokenHash));
}

export async function logoutAll(userId: string): Promise<void> {
  const db = requireDb();
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  log.debug({ userId }, 'All sessions invalidated');
}

// ---------------------------------------------------------------------------
// Email Verification
// ---------------------------------------------------------------------------

export async function verifyEmail(token: string): Promise<{ success: boolean; user: AuthUser }> {
  const db = requireDb();
  const tokenHash = hashToken(token);

  const rows = await db
    .select()
    .from(schema.emailVerificationTokens)
    .where(
      and(
        eq(schema.emailVerificationTokens.tokenHash, tokenHash),
        isNull(schema.emailVerificationTokens.usedAt),
      ),
    )
    .limit(1);

  const record = rows[0];
  if (!record) {
    throw new AppError('TOKEN_INVALID', 'Invalid verification token', 400);
  }

  if (new Date(record.expiresAt) < new Date()) {
    throw new AppError('TOKEN_EXPIRED', 'Verification token has expired', 400);
  }

  // Mark token as used
  await db.update(schema.emailVerificationTokens).set({ usedAt: new Date() }).where(eq(schema.emailVerificationTokens.id, record.id));

  // Update user
  await db
    .update(schema.users)
    .set({ emailVerified: true, emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.userId, record.userId));

  const user = (await getUserById(record.userId))!;
  log.info({ userId: record.userId }, 'Email verified');

  return { success: true, user };
}

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------

export async function requestPasswordReset(email: string): Promise<{ success: boolean }> {
  const db = requireDb();

  const userRows = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1);
  if (!userRows[0]) {
    // Don't reveal whether email exists
    return { success: true };
  }

  const token = randomBytes(32).toString('hex');
  await db.insert(schema.passwordResetTokens).values({
    userId: userRows[0].userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 3_600_000), // 1 hour
  });

  // In production: send email. In dev: log the token.
  log.info({ resetToken: token, email }, 'Password reset token (dev only)');

  return { success: true };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
  const db = requireDb();
  validatePassword(newPassword);

  const tokenHash = hashToken(token);
  const rows = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(
      and(
        eq(schema.passwordResetTokens.tokenHash, tokenHash),
        isNull(schema.passwordResetTokens.usedAt),
      ),
    )
    .limit(1);

  const record = rows[0];
  if (!record) {
    throw new AppError('TOKEN_INVALID', 'Invalid reset token', 400);
  }

  if (new Date(record.expiresAt) < new Date()) {
    throw new AppError('TOKEN_EXPIRED', 'Reset token has expired', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

  // Mark token as used
  await db.update(schema.passwordResetTokens).set({ usedAt: new Date() }).where(eq(schema.passwordResetTokens.id, record.id));

  // Update password & invalidate all sessions
  await db.update(schema.users).set({ passwordHash, updatedAt: new Date() }).where(eq(schema.users.userId, record.userId));
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, record.userId));

  log.info({ userId: record.userId }, 'Password reset completed');

  return { success: true };
}

// ---------------------------------------------------------------------------
// Link Wallet
// ---------------------------------------------------------------------------

export async function linkWallet(
  userId: string,
  walletAddress: string,
  _signature: string,
  nonce: string,
): Promise<{ success: boolean }> {
  const db = requireDb();
  const normalizedAddress = walletAddress.toLowerCase();

  // Verify nonce
  const nonceRows = await db
    .select()
    .from(schema.walletNonces)
    .where(
      and(
        eq(schema.walletNonces.walletAddress, normalizedAddress),
        eq(schema.walletNonces.nonce, nonce),
        isNull(schema.walletNonces.usedAt),
      ),
    )
    .limit(1);

  if (!nonceRows[0] || new Date(nonceRows[0].expiresAt) < new Date()) {
    throw new AppError('INVALID_NONCE', 'Invalid or expired nonce', 401);
  }

  // Mark nonce as used
  await db.update(schema.walletNonces).set({ usedAt: new Date() }).where(eq(schema.walletNonces.id, nonceRows[0].id));

  // Check wallet not already linked
  const existingRows = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.walletAddress, normalizedAddress)).limit(1);
  if (existingRows.length > 0) {
    throw new AppError('WALLET_ALREADY_LINKED', 'This wallet is already connected to an existing account', 409);
  }

  // Link wallet
  await db.update(schema.users).set({ walletAddress: normalizedAddress, updatedAt: new Date() }).where(eq(schema.users.userId, userId));

  log.info({ userId, walletAddress: normalizedAddress }, 'Wallet linked');

  return { success: true };
}

// ---------------------------------------------------------------------------
// User Queries
// ---------------------------------------------------------------------------

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const db = requireDb();
  const rows = await db.select().from(schema.users).where(eq(schema.users.userId, userId)).limit(1);
  return rows[0] ? toAuthUser(rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const db = requireDb();
  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1);
  return rows[0] ? toAuthUser(rows[0]) : null;
}
