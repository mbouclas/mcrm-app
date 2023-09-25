import { Injectable } from "@nestjs/common";
import { IMcmsDiRegistryItem, McmsDiContainer } from "~helpers/mcms-component.decorator";
import { getStoreProperty } from "~root/state";
import { readFilesRecursively } from "~helpers/readDirFiles";
import { resolve } from "path";
import { stat, readFile, writeFile } from "fs/promises";

export interface IUpdateLogEntry {
  id: string;
  updatedAt: Date;
  success: boolean;
}

@Injectable()
export class UpdateService {

  async loadLog() {
    const logFile = resolve(getStoreProperty("configs.general.updates.updatesDir"), "update-log.json");

    if (!await this.checkIfUpdateLogExists()) {

      await writeFile(logFile, JSON.stringify([]), "utf-8");
      return [];
    }

    const buffer = await readFile(logFile, "utf-8");
    return JSON.parse(buffer.toString()) as IUpdateLogEntry[];
  }

  async patchHasRun(id: string) {
    const log = await this.loadLog();
    return log.findIndex(l => l.id === id && l.success) !== -1;
  }

  async executePatch(container: IMcmsDiRegistryItem) {
    const patch = new container["reference"]();
    // if the patch has already run, exit
    if (await this.patchHasRun(container.id)) {
      return;
    }


    try {
      await patch.run();
    } catch (e) {
      console.log(`Error executing patch ${container.id}`, e);
      await this.markPatchAsDone(container.id, false);
    }

    // mark patch as done
    await this.markPatchAsDone(container.id, true);
  }

  private async markPatchAsDone(id: string, runWasSuccessful: boolean) {
    const log = await this.loadLog();
    log.push({
      id,
      success: runWasSuccessful,
      updatedAt: new Date()
    });
    await writeFile(resolve(getStoreProperty("configs.general.updates.updatesDir"), "update-log.json"), JSON.stringify(log), "utf-8");

    return this;
  }

  async getPatches() {
    const patches = McmsDiContainer.filter({ type: "patch" });

    for (const patch of patches) {
      await this.executePatch(patch);
    }
  }

  async getUpdates() {

  }

  /**
   * Go to the patch folder and read all patches and updates
   */
  readAllPatchesAndUpdates() {

    const files = readFilesRecursively(getStoreProperty("configs.general.updates.updatesDir"), ["d.ts", "spec", "map"]);
    const ret = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type === "file" && (file.path.includes(".patch.") || file.path.includes(".update."))) {
        ret.push(require(file.path));
      }
    }

    return ret;
  }

  private async checkIfUpdateLogExists() {
    try {
      return await stat(resolve(getStoreProperty("configs.general.updates.updatesDir"), "update-log.json"));
    }
    catch (e) {
      return false;
    }
  }
}
