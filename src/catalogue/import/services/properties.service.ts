import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { PropertyService } from '~catalogue/property/services/property.service';
import { IBaseFilter } from '~models/general';
import { extractSingleFilterFromObject } from '~helpers/extractFiltersFromObject';
import { createReadStream } from 'fs';
import { PropertyValueModel } from '~catalogue/property/models/property-value.model';
const csv = require('csv-parser');
const slug = require('slug');

export interface IPropertyValueFieldMapper {
  name: string;
  icon?: string;
  image?: string;
  color?: string;
  code?: string;
}

@Injectable()
export class PropertiesService implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    // await PropertiesService.importColorsFromFile(`I:\\Work\\mcms-node\\mcrm\\upload\\color-codes-with-photo-links.csv`)
    // await PropertiesService.importMaterialsFromFile(`I:\\Work\\mcms-node\\mcrm\\upload\\Products-Final.csv`);
  }

  static async importMaterialsFromFile(file: string) {
    const s = new PropertiesService();
    const fieldMapper = {
      name: 'property.material',
    };

    const rows = await s.readPropertyValuesCsv(file, fieldMapper);
    await s.importPropertyValuesFromCsv({ slug: 'material' }, rows, 'slug');
  }

  static async importColorsFromFile(file: string) {
    const s = new PropertiesService();
    const fieldMapper = {
      name: 'Color name',
      icon: '',
      image: 'image',
      color: 'hex code',
      code: 'Color code',
    };

    const rows = await s.readPropertyValuesCsv(file, fieldMapper);
    await s.importPropertyValuesFromCsv({ slug: 'color' }, rows, 'code');
  }

  async readPropertyValuesCsv(filename: string, fieldMapper: IPropertyValueFieldMapper): Promise<PropertyValueModel[]> {
    const rows = [];
    return new Promise((resolve, reject) => {
      createReadStream(filename)
        .pipe(
          csv({
            mapHeaders: ({ header, index }) => header.trim(),
          }),
        )
        .on('data', (data) => {
          const temp = {};

          for (let key in fieldMapper) {
            key = key.trim();
            if (!data[fieldMapper[key]]) {
              continue;
            }
            temp[key] = data[fieldMapper[key]];
          }

          if (temp['name']) {
            temp['slug'] = slug(temp['name'], { lower: true });
          }

          // Set it to true for further processing
          if (temp['image']) {
            // temp['image'] = true;
            temp['imagePending'] = false;
          }

          if (temp['icon']) {
            temp['icon'] = true;
            temp['iconPending'] = true;
          }

          rows.push(temp);
        })
        .on('error', (e) => reject(e))
        .on('end', () => {
          //eliminate possible nulls
          resolve(rows.filter((row) => row.name));
        });
    });
  }

  async importPropertyValuesFromCsv(filter: IBaseFilter, rows: PropertyValueModel[], matchKey = 'slug') {
    const service = new PropertyService();

    const fields = [];
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (fields.includes(key)) {
          return;
        }
        fields.push(key);
      });
    });

    const rowFieldsQuery = fields.map((field) => {
      return `pv.${field} = row.${field}`;
    });

    const { key, value } = extractSingleFilterFromObject(filter);
    const query = `
    UNWIND $rows as row
    MATCH (property:Property {${key}:'${value}'})
    MERGE (pv:PropertyValue {${matchKey}: row['${matchKey}']})
    ON CREATE SET ${rowFieldsQuery.join(',')}, pv.createdAt = datetime()
    ON MATCH SET pv.updatedAt = datetime(), ${rowFieldsQuery.join(',')}
    with row,pv,property
    MERGE (property)-[r1:HAS_VALUE]->(pv) ON CREATE SET r1.createdAt = datetime() ON MATCH SET r1.updatedAt = datetime()
    return *;
    `;
console.log(query)
    try {
      await service.neo.write(query, { rows });
    } catch (e) {
      console.log('Error importing property values', e);
    }
  }
}
