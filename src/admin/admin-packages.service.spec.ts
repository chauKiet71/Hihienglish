import { AdminPackagesService } from './admin-packages.service';
import { PackagesService } from '../packages/packages.service';
import { GUEST_EMAIL_SUFFIX } from '../auth/guest-identity.service';

describe('active package subscribers', () => {
  const now = new Date('2026-09-12T00:00:00Z');
  const expectedWhere = {
    isPremium: true,
    OR: [{ premiumExpiresAt: null }, { premiumExpiresAt: { gt: now } }],
    NOT: { email: { endsWith: GUEST_EMAIL_SUFFIX } },
  };

  beforeEach(() => jest.useFakeTimers().setSystemTime(now));
  afterEach(() => jest.useRealTimers());

  it('filters expired and revoked subscriptions before returning the list and total', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new AdminPackagesService({
      package: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'monthly', name: '1 Tháng' }),
      },
      user: { findMany },
    } as never);

    const result = await service.listSubscribers('monthly');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { packageId: 'monthly', ...expectedWhere },
      }),
    );
    expect(result).toMatchObject({ total: 0, subscribers: [] });
  });

  it('applies the same active-only count to package listings and details', async () => {
    const pkg = { id: 'monthly', name: '1 Tháng', _count: { users: 2 } };
    const findMany = jest.fn().mockResolvedValue([pkg]);
    const findUnique = jest.fn().mockResolvedValue(pkg);
    const service = new PackagesService({
      package: { findMany, findUnique },
    } as never);

    expect(await service.findAll()).toEqual([
      { id: 'monthly', name: '1 Tháng', userCount: 2 },
    ]);
    expect(await service.findOne('monthly')).toEqual({
      id: 'monthly',
      name: '1 Tháng',
      userCount: 2,
    });
    for (const query of [findMany, findUnique]) {
      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { _count: { select: { users: { where: expectedWhere } } } },
        }),
      );
    }
  });
});
