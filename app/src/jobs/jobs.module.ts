import { Global, Module } from '@nestjs/common';
import { JobsLDPlinkService } from './services/jobs.ldplink.service';
import { JobsLDPlinkController } from './controllers/jobs.ldplink.controller';
import { QueueModule } from '../jobqueue/queue.module';
import { JobsLDPlinkNoauthController } from './controllers/jobs.ldplink.noauth.controller';

@Global()
@Module({
  imports: [QueueModule],
  controllers: [JobsLDPlinkController, JobsLDPlinkNoauthController],
  providers: [JobsLDPlinkService],
  exports: [],
})
export class JobsModule {}
