import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ImportQueueService } from "~catalogue/import/services/import-queue.service";
import { Job } from "bullmq";

@Injectable()
export class ImportService implements OnApplicationBootstrap {
  public static jobEventName = 'import:docs';

  async onApplicationBootstrap() {
    ImportQueueService.addWorker(this.processDocs);
  }

  /**
   * Example of how to add something for this worker to pick it up
   * await ImportQueueService.queue.add(ImportService.jobEventName, {docs: [1,2,3]})
   * @param job
   */
  async processDocs(job: Job) {
    console.log(`processing ${job.id}`);
    console.log(job.data)
  }
}
