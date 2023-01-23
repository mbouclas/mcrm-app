import { IGenericObject } from '~models/general';
import { BaseModel } from '~models/base.model';
import { capitalizeFirstLetter } from './capitalizeFirstLetter';

export const fromRecordToModel = (
  resItem: IGenericObject,
  model: typeof BaseModel,
): any => {
  console.log(resItem);
  const newResItem = resItem;

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

    if (!isFieldNested) {
      newResItem[modelFieldName] = resItem[modelFieldName];
    }
  }

  console.log('dead here', newResItem);
  return newResItem;
};
