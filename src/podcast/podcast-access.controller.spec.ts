import { Test } from '@nestjs/testing';
import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request = require('supertest');
import { PodcastAccessController } from './podcast-access.controller';
import { PodcastAccessService } from './podcast-access.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

describe('Podcast admin authorization and input validation', () => {
  let app: INestApplication;
  const access = {
    getAccessMap: jest.fn().mockResolvedValue({}),
    setAccess: jest
      .fn()
      .mockResolvedValue({
        videoId: 'video',
        isPremium: true,
        previewSeconds: 120,
      }),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [PodcastAccessController],
      providers: [
        { provide: PodcastAccessService, useValue: access },
        AdminGuard,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest();
          if (!req.headers.authorization) throw new UnauthorizedException();
          req.user = {
            role: req.headers.authorization === 'admin' ? 'ADMIN' : 'USER',
          };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('exposes read-only settings publicly', async () => {
    await request(app.getHttpServer()).get('/podcasts/access').expect(200);
  });
  it('rejects anonymous and non-admin updates', async () => {
    await request(app.getHttpServer())
      .put('/podcasts/video/access')
      .send({ isPremium: true, previewSeconds: 120 })
      .expect(401);
    await request(app.getHttpServer())
      .put('/podcasts/video/access')
      .set('Authorization', 'free')
      .send({ isPremium: true, previewSeconds: 120 })
      .expect(403);
    expect(access.setAccess).not.toHaveBeenCalled();
  });
  it('lets an admin save valid settings', async () => {
    await request(app.getHttpServer())
      .put('/podcasts/video/access')
      .set('Authorization', 'admin')
      .send({ isPremium: true, previewSeconds: 120 })
      .expect(200);
    expect(access.setAccess).toHaveBeenCalledWith('video', true, 120);
  });
  it.each([
    { isPremium: 'true', previewSeconds: 120 },
    { isPremium: true, previewSeconds: -1 },
    { isPremium: true, previewSeconds: 1.5 },
    { isPremium: true },
    { isPremium: true, previewSeconds: '120' },
  ])('rejects invalid admin input %p', async (payload) => {
    await request(app.getHttpServer())
      .put('/podcasts/video/access')
      .set('Authorization', 'admin')
      .send(payload)
      .expect(400);
    expect(access.setAccess).not.toHaveBeenCalled();
  });
});
