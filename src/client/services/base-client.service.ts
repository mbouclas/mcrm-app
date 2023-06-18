import { Injectable } from "@nestjs/common";

@Injectable()
export class BaseClientService {

  public test() {
    console.log('In base client service')
  }
}
