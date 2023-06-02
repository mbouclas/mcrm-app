import { ValidationError } from "yup";

export function extractValidationErrors(err: ValidationError) {
  return err.inner.reduce((acc, err) => {
    return { ...acc, [err.path as any]: err.message };
  }, {});
}
