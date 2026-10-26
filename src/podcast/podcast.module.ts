import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PodcastAccessController } from './podcast-access.controller';
import { PodcastAccessService } from './podcast-access.service';

@Module({
  imports: [AuthModule],
  controllers: [PodcastAccessController],
  providers: [PodcastAccessService],
  exports: [PodcastAccessService],
})
export class PodcastModule {}
