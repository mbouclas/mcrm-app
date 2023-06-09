import { Injectable, OnModuleInit } from "@nestjs/common";
import { Processor, Queue, Worker } from "bullmq";
import { redisConnectionInfo } from "~helpers/redis-connection-info";
export enum MailQueueEventNames {
  default = 'mailQueue',
}

@Injectable()
export class MailQueueService implements OnModuleInit {
  public static queue: Queue;
  protected static workers: Worker[] = [];
  public static redisConnection = redisConnectionInfo();

  async onModuleInit() {
    MailQueueService.queue = new Queue(MailQueueEventNames.default, {
      connection: MailQueueService.redisConnection
    });

    MailQueueService.queue.on('waiting', (job) => console.log(`${MailQueueEventNames.default}: ${job.id}  now waiting`));

  }

  public static addWorker(worker: Processor, queueName) {
    const w = new Worker(queueName, worker, {
      connection: MailQueueService.redisConnection,
      concurrency: 3
    })
    MailQueueService.workers.push(w);
    return this;
  }

  public static async addQueue(queueName) {

  }

}
