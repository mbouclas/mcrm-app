import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { UserService } from '~user/services/user.service';
import { CustomerService } from '~eshop/customer/services/customer.service';
import { GuestInterceptor } from '~root/auth/interceptors/guest.interceptor';

@Controller('api/customer')
export class CustomerController {
  @Get('')
  async find(@Query() queryParams = {}) {
    const u = await new UserService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
    console.log(u);
    return u;
  }
}
