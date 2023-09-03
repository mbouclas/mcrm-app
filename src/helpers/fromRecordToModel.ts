import { IGenericObject } from '~models/general';
import { BaseModel } from '~models/base.model';
import { capitalizeFirstLetter } from './capitalizeFirstLetter';

export const fromRecordToModel = (resItem: IGenericObject, model: typeof BaseModel): any => {
  const newResItem = resItem;

  for (const modelFieldKey in model.fields) {
    const modelField = model.fields[modelFieldKey];

    const fieldType = modelField.type;
    const modelFieldName = modelField.varName;

    if (fieldType === 'boolean') {
      newResItem[modelFieldName] = Boolean(resItem[modelFieldName]);
    }

    if (fieldType === 'nested') {
      newResItem[modelFieldName] = {};

      for (const nestedFieldKey in modelField.fields) {
        const nestedFieldName = modelField.fields[nestedFieldKey].varName;
        const resNestedKeyName = `${modelFieldName}${capitalizeFirstLetter(nestedFieldName)}`;

        if (resItem[resNestedKeyName]) {
          newResItem[modelFieldName][nestedFieldName] = resItem[resNestedKeyName];

          delete resItem[resNestedKeyName];
        }
      }

      if (!Object.keys(newResItem[modelFieldName]).length) {
        delete newResItem[modelFieldName];
      }
    }

    if (fieldType === 'json' || fieldType == 'image') {
      if (!resItem[modelFieldName]) {
        continue;
      }
      newResItem[modelFieldName] = JSON.parse(resItem[modelFieldName]);
    }

    if (fieldType !== 'nested' && fieldType !== 'json' && fieldType !== 'image') {
      newResItem[modelFieldName] = resItem[modelFieldName];
    }
  }

  let result = resItem;

  result = newResItem;

  return result;
};
