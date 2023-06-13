import { IGenericObject } from "~models/general";

/**
 * Base executor class used to extend executors written for custom client code on the website
 */
export class BaseExecutor {
  async handle(settings: IGenericObject): Promise<any> {

  }
}
