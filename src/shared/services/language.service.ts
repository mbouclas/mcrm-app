import { McmsDi } from "~helpers/mcms-component.decorator";
import { Injectable } from "@nestjs/common";
import { BaseNeoService } from "~shared/services/base-neo.service";
import { IBaseNamedModel } from "~models/appState.model";
import { CacheService } from "~shared/services/cache.service";
import { AppConfigService } from "~shared/services/app-config.service";
import { IBaseFilter, IBaseTranslation, IGenericObject } from "~models/general";

export interface ILanguage extends IBaseNamedModel{
  code: string;
}

@McmsDi({
  id: 'LanguageService',
  type: 'service'
})
@Injectable()
export class LanguageService extends BaseNeoService {
  public redisKey = 'languages';
  protected cache: CacheService;

  constructor() {
    super();
    this.cache = new CacheService();
  }

  async get(): Promise<ILanguage[]> {
    if (await this.cache.exists(this.redisKey)) {
      return await this.cache.get(this.redisKey);
    }

    const query = `MATCH (n:Language) return n;`;
    const result = await this.neo.read(query, {});
    const languages = result.records.map((record: any) => record.get('n').properties);
    await this.cache.put(this.redisKey, languages);

    return languages;
  }

  /**
   * await languageService.getObjectTranslations('ExtraField', {name: 'notes'},['description', 'placeholder', 'label'])
   * @param model
   * @param filter
   * @param keys
   */
  async getObjectTranslations(model: string, filter: IBaseFilter, keys: string[] = ['name']) {
    const key = Object.keys(filter)[0];
    const value = filter[key];

    const query = `MATCH (model:${model}) WHERE model.${key} =~ '${value}'
        WITH model
        MATCH (model)-[translations:HAS_TRANSLATIONS]->(l:Language)
        return translations,l;
        `;

    const result = await this.neo.read(query,{});

    if (result.records.length === 0) {
      return [];
    }

    const returnValues: {[key: string]: any} = {};

    result.records.forEach((record: any) => {
      const translations = record.get('translations').properties;
      const lang = record.get('l').properties;

      for (let key in translations) {
        // console.log('--------',key)
        const idx = keys.indexOf(key);
        if (idx === -1) {
          continue;
        }

        if (!returnValues[key]) {
          returnValues[key] = {}
        }

        returnValues[key][lang.code] = translations[key];
      }


    });

    return returnValues;
  }

  static defaultLanguage() {
    return AppConfigService.site.lang.default;
  }

  defaultLanguage() {
    return AppConfigService.site.lang.default;
  }

  formatModelTranslationsQuery(model: string, uuid: string, translations: IGenericObject, parentId?: string) {
    const translationsToAdd: string[] = [];
    for (let key in translations) {
      translationsToAdd.push(`r.${key} = $${key}[lang.code]`);
    }
    const parentIdQuery = (parentId) ? `{parentId: '${parentId}'}` : '';

    return ` 
        MATCH (langs:Language)
        WITH *
        UNWIND langs as lang
        MERGE (${model})-[r:HAS_TRANSLATIONS ${parentIdQuery}]->(lang) 
        ON CREATE SET  ${translationsToAdd.join(', ')}, ${parentId ? `r.parentId = '${parentId}',` : ''} r.createdAt = datetime()
        ON MATCH SET r.updatedAt = datetime(), ${translationsToAdd.join(', ')}
        WITH *
        `;
  }

  async addTranslationsToModel(model: string, uuid: string, translations: IGenericObject, parentId?: string) {
    const translationsToAdd: string[] = [];
    for (let key in translations) {
      translationsToAdd.push(`r.${key} = $translations.${key}[lang.code]`);
    }
    const parentIdQuery = (parentId) ? `{parentId: '${parentId}'}` : '';

    const query = ` 
        MATCH (model:${model} {uuid: $uuid})
        MATCH (langs:Language)
        WITH *
        UNWIND langs as lang
        MERGE (model)-[r:HAS_TRANSLATIONS ${parentIdQuery}]->(lang) 
        ON CREATE SET  ${translationsToAdd.join(', ')}, ${parentId ? `r.parentId = '${parentId}',` : ''} r.createdAt = datetime()
        ON MATCH SET r.updatedAt = datetime(), ${translationsToAdd.join(', ')}
        return *;
        `;

    let res;
    try {
      res = await this.neo.write(query, {
        uuid,
        parentId,
        translations
      });
    }
    catch (e) {
      this.logger('Error adding translations to model', e);
    }

    return res;
  }

  simplifyTranslationsObject(translations: IGenericObject, code: string, originalObject: IGenericObject, ignoreKeys: string[] = ['updatedAt', 'createdAt']) {
    for (let key in translations) {
      if (ignoreKeys.indexOf(key) !== -1) { continue; }

      if (typeof originalObject[key] !== 'object') {originalObject[key] = {};}

      originalObject[key][code] = translations[key];
    }

    return originalObject;
  }

  rawTranslationsToSimplified(raw: IBaseTranslation[]) {
    const obj: IGenericObject<IBaseTranslation> = {};
    raw.filter(translation => translation.code)
      .forEach(translation => {
        const simplifiedObject = this.simplifyTranslationsObject(translation, translation.code, obj, ['code']);
        for (let key in simplifiedObject) {
          obj[key][translation.code] = simplifiedObject[key][translation.code]
        }
      });

    return obj;
  }

  async buildTranslationsObject() {
    const obj: IGenericObject = {};

    const languages = await this.get();
    languages.forEach(language => obj[language.code] = '');

    return obj;
  }
}
