import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { createWorkers } from '../workers/ld_plink.main';
import { LdPlinkJobQueue } from './queue/ld_plink.queue';
import { NatsModule } from '../nats/nats.module';
import { JobCompletedPublisher } from '../nats/publishers/job-completed-publisher';


@Module({
  imports: [NatsModule],
  providers: [LdPlinkJobQueue],
  exports: [LdPlinkJobQueue],
})
export class QueueModule implements OnModuleInit {
  @Inject(JobCompletedPublisher) jobCompletedPublisher: JobCompletedPublisher;
  async onModuleInit() {
    await createWorkers(this.jobCompletedPublisher);
  }
}
