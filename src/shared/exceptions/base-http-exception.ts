import { HttpException, HttpStatus } from '@nestjs/common';

interface ValidationError {
  field: string;
  code: string;
}

interface BaseHttpErrorInput {
  error: string;
  reason: string;
  code: string;
  statusCode: number;
  validationErrors?: ValidationError[];
}

export default class BaseHttpException extends HttpException {
  constructor(error: BaseHttpErrorInput) {
    const { statusCode, ...errorObject } = error;
    const response = {
      ...errorObject,
    };
    super(response, statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
