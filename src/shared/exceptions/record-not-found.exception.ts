import { BaseException } from "~root/exceptions/base.exception";

export class RecordNotFoundException extends BaseException {
  public getQuery () {
    if (this.errors && this.errors.query) {
      return this.errors.query;
    }
  }
}
