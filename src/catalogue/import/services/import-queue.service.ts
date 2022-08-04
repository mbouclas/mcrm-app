import { Injectable, Logger, OnApplicationBootstrap, OnModuleInit } from "@nestjs/common";
import { Processor, Queue, Worker } from "bullmq";



@Injectable()
export class ImportQueueService implements OnModuleInit {

  private static readonly logger = new Logger(ImportQueueService.name);
  public static queueName = 'importQueue'
  public static queue: Queue;
  protected static workers: Worker[] = [];
  protected static redisConnection = {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_AUTH,
    port: parseInt(process.env.REDIS_PORT),
    db: parseInt(process.env.REDIS_DB),
  };

  async onModuleInit() {
    ImportQueueService.queue = new Queue(ImportQueueService.queueName, {
      connection: ImportQueueService.redisConnection
    });
    ImportQueueService.queue.on('waiting', (job) => ImportQueueService.logger.log(`${ImportQueueService.queueName}: ${job.id}  now waiting`));
  }

  public static addWorker(worker: Processor) {
    const w = new Worker(ImportQueueService.queueName, worker, {
      connection: ImportQueueService.redisConnection
    })
    ImportQueueService.workers.push(w);

    return this;
  }
}
