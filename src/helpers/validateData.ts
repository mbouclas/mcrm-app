import BaseHttpException from '~root/shared/exceptions/base-http-exception';
import * as yup from 'yup';
import { IGenericObject } from '~root/models/general';

export const validateData = async (data: IGenericObject, schema) => {
  try {
    await schema.validate(data, { abortEarly: false });
  } catch (e) {
    if (e instanceof yup.ValidationError && e.inner.length) {
      const validationErrors = e.inner.map((err) => ({
        field: err.path,
        code: err.message,
      }));

      throw new BaseHttpException({
        error: 'VALIDATION_FAILED',
        reason: 'Validation failed',
        code: '100.10',
        statusCode: 400,
        validationErrors: validationErrors,
      });
    }

    throw e;
  }
};
