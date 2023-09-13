import { Module } from "@nestjs/common";
import { readFilesRecursively } from "~helpers/readDirFiles";
import { resolve } from "path";
import { projectRoot } from "~root/main";
import { SharedModule } from "~shared/shared.module";

@Module({

  providers: [],
})
export class ClientCodeModule {

  async onModuleInit() {

    /**
     * Load all modules from the client-code folder
     */

      const files = readFilesRecursively(resolve(projectRoot, 'dist', 'client-code'), ['d.ts', 'spec', 'map']);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.type === 'file' && file.path.includes('.module.')) {
          const LazyModule = await import(file.path);

          // console.log(LazyModule[Object.keys(LazyModule)[0]])

          try {
            const moduleRef = await SharedModule.lazyModuleLoader.load(() => LazyModule[Object.keys(LazyModule)[0]]);
          }
          catch (e) {
            console.log(e)
          }
        }
      }



  }

  onApplicationBootstrap() {

  }
}
