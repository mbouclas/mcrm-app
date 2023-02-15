import { HttpException } from '@nestjs/common';

interface BaseHttpErrorInput {
  error: string;
  reason: string;
  code: string;
  statusCode: number;
}

export default class BaseHttpException extends HttpException {
  constructor(error: BaseHttpErrorInput) {
    const { statusCode, ...errorObject } = error;
    super(errorObject, statusCode);
  }
}
