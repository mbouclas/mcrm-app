import { IGenericObject } from '~models/general';
import { BaseModel } from '~models/base.model';
import { capitalizeFirstLetter } from './capitalizeFirstLetter';

export const fromRecordToModel = (
  resItem: IGenericObject,
  model: typeof BaseModel,
): any => {
  const hasParent = resItem[model.modelConfig.as];
  const newResItem = resItem[model.modelConfig.as] || resItem;

  for (const modelFieldKey in model.fields) {
    const modelField = model.fields[modelFieldKey];

    const modelFieldType = modelField.type;
    const modelFieldName = modelField.varName;

    if (modelFieldType === 'nested') {
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

    if (modelFieldType === 'json') {
      newResItem[modelFieldName] = JSON.parse(resItem[modelFieldName]);
    }

    if (modelFieldType !== 'json' && modelFieldType !== 'nested') {
      newResItem[modelFieldName] = hasParent
        ? resItem[model.modelConfig.as][modelFieldName]
        : resItem[modelFieldName];
    }
  }

  let result = resItem;

  if (hasParent) {
    result[model.modelConfig.as] = newResItem;
  }

  return result;
};
