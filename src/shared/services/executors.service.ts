import { Injectable } from "@nestjs/common";
import { InvalidExecutorException } from "~shared/exceptions/invalid-executor.exception";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";

import { McmsContainerNotFoundException } from "~shared/exceptions/mcms-container-not-found.exception";

/**
 * To get the service from the container, it must bet @Injectable() AND @McmsDi()
 * It must also have a valid reference to its parent module to get the DI correct
 * @param executor The name of the executor. Either ClassName or ClassName::methodName if you have a method to execute
 * @param returnJustTheInstance If true, it will return the instance of the service from the container
 * @param executeTheMethod If true, it will execute the method and return the result
 * @param methodParameters The parameters to pass to the method. Must be an array of parameters to spread them to the target method. If you have only one parameter, you must wrap it in an array
 */
@Injectable()
export class ExecutorsService {
  static executorFromString(executor: string, returnJustTheInstance = true, executeTheMethod = false, methodParameters: any[]) {
    const [containerName, method] = executor.split('::');

    if (!containerName || !method) {
      throw new InvalidExecutorException('INVALID_EXECUTOR', '0002.1', { executor });
    }

    const container = McmsDiContainer.get({
      id: containerName,
    });

    if (!container) {
      throw new McmsContainerNotFoundException('CONTAINER_NOT_FOUND', '0002.2', { containerName, executor });
    }


    const service = container.reference;
    let instance;


    /**
     * Get a new instance of the service from the container
     */
    try {
      instance = service.moduleRef.get(service);
    }
    catch (e) {
      console.log(e)
    }

    // now check if the method exists
    if (!instance[method]) {
      throw new InvalidExecutorException('METHOD_DOES_NOT_EXIST', '0002.3', { executor, method });
    }

    if (returnJustTheInstance) {
      return instance;
    }

    if (executeTheMethod) {
      try {
        return instance[method].call(instance, ...methodParameters);
      }
      catch (e) {
        console.log(e)
        throw new InvalidExecutorException('METHOD_EXECUTION_FAILED', '0002.4', { executor, method, methodParameters, error: e });
      }
    }

    return {
      instance,
      method,
    }
  }

  static async executeHook(hook: string, methodParameters: any[]) {
    if (!hook || hook === '' || hook.length === 0) {
      return
    }

    try {
      const hookExecutor = ExecutorsService.executorFromString(hook, false, true, methodParameters);
      return hookExecutor;
    }
    catch (e) {
      throw new InvalidExecutorException('HOOK_EXECUTION_FAILED', '0002.5', { hook, methodParameters, error: e });
    }
  }
}
