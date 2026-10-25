import { Prisma } from '@prisma/client';
import { GUEST_EMAIL_SUFFIX } from '../auth/guest-identity.service';

// Check expiry at read time: inactive users may still have a saved packageId
// until their next authenticated request clears the expired subscription.
export function activeSubscribersWhere(
  now = new Date(),
): Prisma.UserWhereInput {
  return {
    isPremium: true,
    OR: [{ premiumExpiresAt: null }, { premiumExpiresAt: { gt: now } }],
    NOT: { email: { endsWith: GUEST_EMAIL_SUFFIX } },
  };
}
