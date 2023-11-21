import BaseHttpException from "~shared/exceptions/base-http-exception";

export class CouldNotGeneratePreviewUrlHttpException extends BaseHttpException {
  constructor(e: Error) {
    super({
      code: '1999.6',
      error: e.message,
      reason: e.message,
      statusCode: 500,
    });
  }
}
