import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { PaymentMethodService } from '~eshop/payment-method/services/payment-method.service';

@Controller('api/customer-payment-method')
export class CustomerPaymentMethodController {
  constructor() {}

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new PaymentMethodService().findOne({ uuid }, rels);
  }

  @Patch(`:uuid`)
  async update(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    return await new PaymentMethodService().update(uuid, body);
  }

  @Post()
  async store(@Body() body: IGenericObject) {
    return await new PaymentMethodService().store(body);
  }

  @Delete()
  async delete(@Param('id') uuid: string) {
    return await new PaymentMethodService().delete(uuid);
  }
}
