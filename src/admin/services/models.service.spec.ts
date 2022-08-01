require('dotenv').config();
import { Test } from '@nestjs/testing';
import { ModelsService } from "./models.service";
import { store } from "../../state";
import { SharedModule } from "../../shared/shared.module";
import { AdminModule } from "../admin.module";

describe('ModelsService', () => {
  let modelService: ModelsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        SharedModule,
        AdminModule,
      ],
      controllers: [],
      providers: [ModelsService],
    }).compile();

    modelService = moduleRef.get<ModelsService>(ModelsService);
  });

  describe('loadModels', () => {
    it("should load all the models from the DB into Memory", async () => {
      await modelService.mergeModels();
      expect(Object.keys(store.getState().models)).toContain('Gate')
    });
  })
});
