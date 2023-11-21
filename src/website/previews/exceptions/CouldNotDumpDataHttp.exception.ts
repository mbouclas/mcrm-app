import { HttpException, HttpStatus } from "@nestjs/common";

export class CouldNotDumpDataHttpException extends HttpException {
    constructor(message: string) {
        super(message || 'COULD_NOT_DUMP_DATA', HttpStatus.SEE_OTHER);
    }
}
