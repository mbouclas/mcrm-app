import { BaseException } from "~root/exceptions/base.exception";
import { ValidationError } from "yup";

export class InvalidOrderException extends BaseException {
    constructor(message, code?: string, errors?: ValidationError) {
        super(message, code, errors);
    }
}
