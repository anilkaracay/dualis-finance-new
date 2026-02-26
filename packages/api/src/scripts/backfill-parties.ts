/**
 * Backfill script: allocate real Canton parties for existing users
 * that have fake "party::*" IDs.
 *
 * Usage: npx tsx packages/api/src/scripts/backfill-parties.ts
 */

import { like, eq } from 'drizzle-orm';
import { getDb, schema } from '../db/client.js';
import { getPartyLayerProvider } from '../canton/partylayer.js';
import { createPartyMappingDirect } from '../services/partyMapping.service.js';
import { createChildLogger } from '../config/logger.js';

const log = createChildLogger('backfill-parties');

async function backfillParties() {
  const db = getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  const provider = getPartyLayerProvider();

  // Find users with fake party IDs
  const users = await db
    .select({
      userId: schema.users.userId,
      partyId: schema.users.partyId,
      role: schema.users.role,
      email: schema.users.email,
    })
    .from(schema.users)
    .where(like(schema.users.partyId, 'party::%'));

  log.info({ count: users.length }, 'Found users with fake party IDs');

  let success = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const { partyId: realPartyId } = await provider.allocateParty(
        user.userId,
        `${user.role}_${user.userId}`,
      );

      // Update user record
      await db
        .update(schema.users)
        .set({ partyId: realPartyId, updatedAt: new Date() })
        .where(eq(schema.users.userId, user.userId));

      // Create party mapping
      await createPartyMappingDirect(user.userId, realPartyId, 'custodial');

      success++;
      log.info(
        { userId: user.userId, oldPartyId: user.partyId, newPartyId: realPartyId },
        'Party backfilled',
      );
    } catch (err) {
      failed++;
      log.error(
        { userId: user.userId, err },
        'Failed to backfill party',
      );
    }
  }

  log.info({ total: users.length, success, failed }, 'Backfill complete');
  process.exit(failed > 0 ? 1 : 0);
}

backfillParties().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
