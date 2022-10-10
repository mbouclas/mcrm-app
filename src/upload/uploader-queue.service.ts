import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Processor, Queue, Worker } from "bullmq";
import { redisConnectionInfo } from "~helpers/redis-connection-info";

@Injectable()
export class UploaderQueueService implements OnModuleInit {
  private static readonly logger = new Logger(UploaderQueueService.name);
  public static queueName = 'uploaderQueue'
  public static queue: Queue;
  protected static workers: Worker[] = [];
  protected static redisConnection = redisConnectionInfo();

  async onModuleInit() {
    UploaderQueueService.queue = new Queue(UploaderQueueService.queueName, {
      connection: UploaderQueueService.redisConnection
    });
    UploaderQueueService.queue.on('waiting', (job) => UploaderQueueService.logger.log(`${UploaderQueueService.queueName}: ${job.id}  now waiting`));
  }

  public static addWorker(worker: Processor) {
    const w = new Worker(UploaderQueueService.queueName, worker, {
      connection: UploaderQueueService.redisConnection
    })
    UploaderQueueService.workers.push(w);

    return this;
  }
}
