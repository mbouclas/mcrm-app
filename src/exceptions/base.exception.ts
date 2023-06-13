
export abstract class BaseException implements Error {

    constructor(public message: string, public code?: string, public errors?: any) {

    }
    name: string;

    getCode() {return this.code;}

    getMessage() {return this.message;}

    getErrors() {return this.errors || {};}
}
