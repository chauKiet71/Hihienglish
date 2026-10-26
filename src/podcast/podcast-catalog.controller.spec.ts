import { Test } from '@nestjs/testing';
import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request = require('supertest');
import {
  AdminPodcastCatalogController,
  PodcastCatalogController,
} from './podcast-catalog.controller';
import { PodcastCatalogService } from './podcast-catalog.service';
import { PodcastImportService } from './podcast-import.service';
import { YoutubeCatalogService } from './youtube-catalog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

describe('Podcast catalog HTTP authorization and validation', () => {
  let app: INestApplication;
  const catalog = {
    list: jest.fn().mockResolvedValue([]),
    addChannel: jest.fn().mockResolvedValue({}),
    setChannelVisible: jest.fn(),
    setVideoVisible: jest.fn(),
  };
  const imports = {
    create: jest.fn().mockResolvedValue({ id: 'job' }),
    get: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    commit: jest.fn(),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminPodcastCatalogController, PodcastCatalogController],
      providers: [
        { provide: PodcastCatalogService, useValue: catalog },
        { provide: PodcastImportService, useValue: imports },
        { provide: YoutubeCatalogService, useValue: { configured: true } },
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
    await app.close();
  });
  beforeEach(() => jest.clearAllMocks());
  it('serves only the public catalog anonymously', async () => {
    await request(app.getHttpServer()).get('/podcasts/catalog').expect(200);
    expect(catalog.list).toHaveBeenCalledWith();
    await request(app.getHttpServer())
      .get('/admin/podcasts/catalog')
      .expect(401);
  });
  it.each([
    '/admin/podcasts/channels',
    '/admin/podcasts/channels/bbc/imports',
    '/admin/podcasts/imports/job/commit',
  ])('rejects non-admin writes to %s', async (url) => {
    await request(app.getHttpServer())
      .post(url)
      .set('Authorization', 'free')
      .send({})
      .expect(403);
    expect(imports.create).not.toHaveBeenCalled();
    expect(imports.commit).not.toHaveBeenCalled();
  });
  it.each([0, -1, 101, 1.5, '20'])(
    'rejects invalid requested video count %s',
    async (count) => {
      await request(app.getHttpServer())
        .post('/admin/podcasts/channels/bbc/imports')
        .set('Authorization', 'admin')
        .send({ mode: 'OLDER', count })
        .expect(400);
      expect(imports.create).not.toHaveBeenCalled();
    },
  );
  it('accepts bounded imports and rejects arbitrary modes', async () => {
    await request(app.getHttpServer())
      .post('/admin/podcasts/channels/bbc/imports')
      .set('Authorization', 'admin')
      .send({ mode: 'OLDER', count: 30 })
      .expect(201);
    expect(imports.create).toHaveBeenCalledWith('bbc', 'OLDER', 30, undefined);
    await request(app.getHttpServer())
      .post('/admin/podcasts/channels/bbc/imports')
      .set('Authorization', 'admin')
      .send({ mode: 'DELETE', count: 30 })
      .expect(400);
  });
  it('validates visibility as a real boolean', async () => {
    await request(app.getHttpServer())
      .patch('/admin/podcasts/videos/video')
      .set('Authorization', 'admin')
      .send({ isVisible: 'false' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/admin/podcasts/videos/video')
      .set('Authorization', 'admin')
      .send({ isVisible: false })
      .expect(200);
    expect(catalog.setVideoVisible).toHaveBeenCalledWith('video', false);
  });
  it('rejects empty or oversized selections before import', async () => {
    for (const videoIds of [[], Array(101).fill('video000001')])
      await request(app.getHttpServer())
        .post('/admin/podcasts/imports/job/commit')
        .set('Authorization', 'admin')
        .send({ videoIds })
        .expect(400);
    expect(imports.commit).not.toHaveBeenCalled();
  });
});
