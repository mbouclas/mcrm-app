import { IGenericObject } from "../models/general";

export function translateObject(obj: IGenericObject, lang: string, key?: string) {
  if (!obj) {return '';}
  // assumes a translation like {en: '',gr:''}
  if (!key) {
    return obj[lang];
  }
  //assumes simplified translation model like name_en,name_gr

  return (obj[`${key}_${lang}`]) ? obj[`${key}_${lang}`] : obj[key][lang];
}
