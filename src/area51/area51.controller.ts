import { Body, Controller, Get, Post } from "@nestjs/common";
import { Area51Service } from "~root/area51/area51.service";
import { UserService } from "~user/services/user.service";
import { UserModel } from "~user/models/user.model";
import { RoleModel } from "~user/role/models/role.model";

@Controller('api/area51')
export class Area51Controller {
  onApplicationBootstrap() {
    setTimeout(async () => {
      const s = new UserService();

/*      try {
        await s.attachModelToAnotherModel(UserModel,RoleModel, {email: 'test@tester.com'}, {name: 'customer'}, 'role')
      }
      catch (e) {
        console.log(e)
      }*/

    }, 1000);
  }
  @Get('data')
  async getData() {
    const service = new Area51Service();
    return await service.find({});
  }

  @Post('fields')
  async saveFields(@Body() data: any) {
    const service = new Area51Service();
    if (data.uuid) {
      return await service.update(data.uuid, data);
    }

    return await service.store(data);
  }
}
