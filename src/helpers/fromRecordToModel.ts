import { IGenericObject } from '~models/general';
import { BaseModel } from '~models/base.model';
import { capitalizeFirstLetter } from './capitalizeFirstLetter';

export const fromRecordToModel = (
  resItem: IGenericObject,
  model: typeof BaseModel,
): any => {
  const newResItem = resItem[model.modelConfig.as];

  for (const modelFieldKey in model.fields) {
    const modelField = model.fields[modelFieldKey];

    const fieldType = modelField.type;
    const modelFieldName = modelField.varName;

    if (fieldType === 'nested') {
      newResItem[modelFieldName] = {};

      for (const nestedFieldKey in modelField.fields) {
        const nestedFieldName = modelField.fields[nestedFieldKey].varName;
        const resNestedKeyName = `${modelFieldName}${capitalizeFirstLetter(
          nestedFieldName,
        )}`;

        if (resItem[resNestedKeyName]) {
          newResItem[modelFieldName][nestedFieldName] =
            resItem[resNestedKeyName];

          delete resItem[resNestedKeyName];
        }
      }

      if (!Object.keys(newResItem[modelFieldName]).length) {
        delete newResItem[modelFieldName];
      }
    }

    if (fieldType === 'json') {
      newResItem[modelFieldName] = JSON.parse(
        resItem[model.modelConfig.as][modelFieldName],
      );
    }

    if (fieldType !== 'nested' && fieldType !== 'json') {
      newResItem[modelFieldName] =
        resItem[model.modelConfig.as][modelFieldName];
    }
  }

  let result = resItem;

  result[model.modelConfig.as] = newResItem;

  return result;
};
