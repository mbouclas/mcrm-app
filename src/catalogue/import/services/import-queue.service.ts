import { Injectable, Logger, OnApplicationBootstrap, OnModuleInit } from "@nestjs/common";
import { Processor, Queue, Worker, QueueEvents } from "bullmq";
import { redisConnectionInfo } from "~helpers/redis-connection-info";



@Injectable()
export class ImportQueueService implements OnModuleInit {

  private static readonly logger = new Logger(ImportQueueService.name);
  public static queueName = 'importQueue'
  public static imageProcessingQueueName = 'importImageProcessingQueue'
  public static queue: Queue;
  public static imageProcessingQueue: Queue;
  protected static workers: Worker[] = [];
  protected static redisConnection = redisConnectionInfo();
  public static imageProcessingEvents: QueueEvents;

  async onModuleInit() {
    ImportQueueService.queue = new Queue(ImportQueueService.queueName, {
      connection: ImportQueueService.redisConnection
    });
    ImportQueueService.imageProcessingQueue = new Queue(ImportQueueService.imageProcessingQueueName, {
      connection: ImportQueueService.redisConnection
    });
    ImportQueueService.imageProcessingEvents = new QueueEvents(ImportQueueService.imageProcessingQueueName, {
      connection: ImportQueueService.redisConnection
    });
    ImportQueueService.queue.on('waiting', (job) => ImportQueueService.logger.log(`${ImportQueueService.queueName}: ${job.id}  now waiting`));
    ImportQueueService.imageProcessingQueue.on('waiting', (job) => ImportQueueService.logger.log(`${ImportQueueService.imageProcessingQueueName}: ${job.id}  now waiting`));
  }

  public static addWorker(worker: Processor, queueName) {
    const w = new Worker(queueName, worker, {
      connection: ImportQueueService.redisConnection,
      concurrency: 3
    })
    ImportQueueService.workers.push(w);

    return this;
  }


}
