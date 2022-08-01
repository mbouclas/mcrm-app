
export abstract class BaseException implements Error {

    constructor(public message: string) {

    }
    name: string;
    getMessage() {return this.message;}
}
