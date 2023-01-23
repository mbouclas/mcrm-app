import { IGenericObject } from '~models/general';
import { BaseModel } from '~models/base.model';
import { capitalizeFirstLetter } from './capitalizeFirstLetter';

export const fromRecordToModel = (
  resItem: IGenericObject,
  model: typeof BaseModel,
): any => {
  const newResItem = {};
  for (const modelFieldKey in model.fields) {
    const modelField = model.fields[modelFieldKey];

    const isFieldNested = modelField.type === 'nested';
    const modelFieldName = modelField.varName;

    if (isFieldNested) {
      newResItem[modelFieldName] = {};

      for (const nestedFieldKey in modelField.fields) {
        const nestedFieldName = modelField.fields[nestedFieldKey].varName;
        const resNestedKeyName = `${modelFieldName}${capitalizeFirstLetter(
          nestedFieldName,
        )}`;

        newResItem[modelFieldName][nestedFieldName] = resItem[resNestedKeyName];
      }
    }

    if (!isFieldNested) {
      newResItem[modelFieldName] = resItem[modelFieldName];
    }

    resItem[modelFieldName];
  }

  return newResItem;
};
