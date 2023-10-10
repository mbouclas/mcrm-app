import BaseHttpException, { ValidationError } from '~root/shared/exceptions/base-http-exception';
import { IGenericObject } from '~root/models/general';
import { z } from 'zod';

export const transformErrors = (zodError: z.ZodError): ValidationError[] => {
  const customErrors = [];

  zodError.issues.forEach((issue) => {
    const field = issue.path.join('.');
    const code = issue.message;

    if (!customErrors.some((customError) => customError.field === field && customError.code === code)) {
      customErrors.push({ field, code });
    }
  });

  return customErrors;
};

const hasOnlyActiveProperty = (obj) => {
  const keys = Object.keys(obj);
  return keys.length === 1 && keys[0] === 'active';
};

export const validateData = async (data: IGenericObject, schema) => {
  if (hasOnlyActiveProperty(data)) {
    return null;
  }

  try {
    await schema.parse(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new BaseHttpException({
        error: null,
        reason: 'Validation failed',
        code: null,
        statusCode: null,
        validationErrors: transformErrors(e),
      });
    }

    throw e;
  }
};
