import {
  ImportTemplateField,
  McrmImportTemplate
} from "~catalogue/import/decorators/import-template-registry.decorator";
import { Injectable } from "@nestjs/common";
import { BaseImportService, IBaseProcessorResult } from "~catalogue/import/services/base-import.service";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { ImageService } from "~image/image.service";

@McrmImportTemplate({
  id: "ImportRawImagesTemplate",
  name: "Import Raw Images Template",
  description: "Import images from a json file",
  type: "images",
})
@Injectable()
export class ImportRawImagesTemplate extends BaseImportService {
  @ImportTemplateField({name: 'uuid', importFieldName: 'uuid', required: false, type: 'text'})
  public uuid: string;

  @ImportTemplateField({name: 'url', importFieldName: 'url', required: false, type: 'text'})
  public url: string;

  async onApplicationBootstrap(): Promise<void> {
    setTimeout(async () => {
      const dummyFile = {
        fieldname: 'file',
        originalname: 'CLOTHING masterfile 2022.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        destination: 'I:\\Work\\mcms-node\\upload',
        filename: '5eec2a19d0d945fe4ef30f4139ae0095',
        path: 'I:\\Work\\mcms-node\\mcrm\\logs\\images.csv',
        size: 17760597,
      };

      // await (new ImportRawImagesTemplate()).analyze(dummyFile);
    }, 2000);
  }

  async analyze(file: Partial<Express.Multer.File>): Promise<IBaseProcessorResult> {
    if (!existsSync(file.path)) {
      throw new Error(`File ${file.path} does not exist`);
    }

    // load the file
    const buffer = await readFile(file.path);
    const data = JSON.parse(buffer.toString());

    // console.log(query)
// console.log(`:param {rows: ${JSON.stringify([data[0]])}}`)



    return {
      invalidRows: [],
      isInvalid: false,
      validRows: data.length,
      data,
    }
  }

  async process(file: Partial<Express.Multer.File>) {
    const buffer = await readFile(file.path);
    const data = JSON.parse(buffer.toString());

    const fields = [];
    for (const idx in data) {
      const row = data[idx];
      for (const key in row) {
        if (!fields.includes(key) && ['createdAt', 'updatedAt', 'uuid'].indexOf(key) === -1) {
          fields.push(key);
        }
      }
    }

    const fieldsQuery = fields.map((key) => `n.${key} = CASE WHEN row.${key} IS NOT NULL THEN row.${key} ELSE NULL END`).join(', ');
    const query = `
    UNWIND $rows as row
    MERGE (n:Image {uuid: row.uuid})
    SET ${fieldsQuery}
    `;

    const service = new ImageService();

    try {
      await service.neo.write(query, {
        rows: data}
      );
    }
    catch (e) {
      console.log(`Error executing image update query`, e);
    }


    return {
      success: true,
      rowsProcessed: 0,
    }
  }
}
