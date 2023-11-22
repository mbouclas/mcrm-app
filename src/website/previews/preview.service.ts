import { Injectable } from '@nestjs/common';
import { getStoreProperty } from "~root/state";
import { SharedModule } from "~shared/shared.module";
import { firstValueFrom } from "rxjs";
import type { AxiosResponse } from "axios";
import { PreviewServerNotRunningException } from "~website/previews/exceptions/PreviewServerNotRunning.exception";
import { CouldNotStartPreviewServerException } from "~website/previews/exceptions/CouldNotStartPreviewServer.exception";
import { executeOsCommand, executeOsCommandPromise } from "~helpers/execute-os-command";
import { PermalinkBuilderService } from "~website/menu/permalink-builder.service";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import {
  CouldNotGeneratePreviewUrlHttpException
} from "~website/previews/exceptions/CouldNotGeneratePreviewUrlHttp.exception";
import { CouldNotGenerateUrlException } from "~website/previews/exceptions/CouldNotGenerateUrl.exception";

export interface IPreviewServerConfig {
  location: string;
  baseUrl: string;
  scripts: IPreviewServerScripts;
}
export interface IPreviewServerScripts {
  dev: string;
  dumpData: string;
}

@Injectable()
export class PreviewService {
  config: IPreviewServerConfig;

  constructor() {
    this.config = getStoreProperty('configs.general.previewServer') as IPreviewServerConfig;
  }

  async pingServer() {
    let res: AxiosResponse<any>;
    try {
      res = await firstValueFrom(
        SharedModule.http.get(this.config.baseUrl));
    }
    catch (e) {
      return {status: 0} as AxiosResponse<any>;
    }

    return {status: 1};
  }

  async checkIfPreviewServerIsRunning(autoStart = true, dumpData = true) {
    let res: {status: number};
    // ping the preview server
    try {
      res = await this.pingServer();
    }
    catch (e) {

    }

    let isRunning = res.status === 1;

    if (isRunning && dumpData) {
      await this.dumpData();
      return true;
    }

    if (isRunning) {
      return true;
    }

    if (!isRunning && !autoStart) {
      throw new PreviewServerNotRunningException('PREVIEW_SERVER_NOT_RUNNING', '1500.1');
    }


    // try to start the server
    try {
      await this.startPreviewServer();
    }
    catch (e) {
      throw new CouldNotStartPreviewServerException('COULD_NOT_START_PREVIEW_SERVER', '1500.2');
    }

    return true;
  }

  async dumpData() {
    // dump the data to get the latest
    try {
      await executeOsCommandPromise(this.config.scripts.dumpData, this.config.location, false);
    }
    catch (e) {
      console.log('Error dumping the data',e);
      throw new CouldNotStartPreviewServerException('ERROR_DUMPING_DATA', '1500.3', e);
    }

    return true;
  }

  async startPreviewServer() {
    await this.dumpData();

    try {
      await executeOsCommand(this.config.scripts.dev, this.config.location, true);
    }
    catch (e) {
      console.log('Error starting preview server',e);
      throw new CouldNotStartPreviewServerException('COULD_NOT_START_PREVIEW_SERVER', '1500.4');
    }

  }

  async generatePreviewUrl(modelName: string, itemId: string) {
    const serviceContainer = McmsDiContainer.findOne({id: `${modelName}Service`});
    if (!serviceContainer) {
      return this.config.baseUrl;
    }

    const model = await new serviceContainer.reference().findOne({uuid: itemId});

    try {
      const permalink = new PermalinkBuilderService().build(modelName, model);
      return `${this.config.baseUrl}${permalink}`;
    } catch (e) {
      throw new CouldNotGenerateUrlException('COULD_NOT_GENERATE_PREVIEW_URL', '1500.5', e);
    }

  }
}
