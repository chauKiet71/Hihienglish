import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JWT premium expiration', () => {
  const now = new Date('2026-09-12T00:00:00Z');
  beforeEach(() => jest.useFakeTimers().setSystemTime(now));
  afterEach(() => jest.useRealTimers());

  it.each([
    ['already expired', new Date('2026-08-21T12:27:00Z'), false],
    ['expires exactly now', now, false],
    ['still valid', new Date(now.getTime() + 1), true],
    ['no expiry', null, true],
  ])(
    'returns the correct VIP access when %s',
    async (_, premiumExpiresAt, isPremium) => {
      const user = {
        id: 'subscriber',
        status: 'ACTIVE',
        isPremium: true,
        premiumExpiresAt,
      };
      const update = jest.fn().mockResolvedValue({ ...user, isPremium: false });
      const strategy = new JwtStrategy(
        new ConfigService({ JWT_SECRET: 'test-only-secret' }),
        {
          user: { findUnique: jest.fn().mockResolvedValue(user), update },
        } as never,
      );

      const result = await strategy.validate({
        sub: user.id,
        email: 'subscriber@example.com',
        role: 'USER',
      });

      expect(result.isPremium).toBe(isPremium);
      if (isPremium) {
        expect(update).not.toHaveBeenCalled();
      } else {
        expect(update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: user.id },
            data: { isPremium: false, packageId: null },
          }),
        );
      }
    },
  );
});
