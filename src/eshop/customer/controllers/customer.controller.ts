import { Body, Controller, Get, Param, Patch, Query, UseInterceptors } from '@nestjs/common';
import { UserService } from '~user/services/user.service';
import { CustomerService } from '~eshop/customer/services/customer.service';
import { GuestInterceptor } from '~root/auth/interceptors/guest.interceptor';
import { IGenericObject } from '~root/models/general';

@Controller('api/customer')
export class CustomerController {
  @Get('')
  async find(@Query() queryParams = {}) {
    const u = await new UserService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
    console.log(u);
    return u;
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    return new UserService().findOne({ uuid }, ['address', 'orders']);
  }

  @Patch(':uuid')
  async update(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    return await new UserService().update(uuid, body);
  }
}
