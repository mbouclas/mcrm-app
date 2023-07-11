import { Controller, Get, Query } from "@nestjs/common";
import { UserService } from "~user/services/user.service";

@Controller('api/user')
export class UserController {
  @Get('')
  async find(@Query() queryParams = {}) {

    return await new UserService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);;
  }
}
