import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Session,
} from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { OrderService } from '~eshop/order/services/order.service';
import { ProductService } from '~root/catalogue/product/services/product.service';
import { CartService } from '~eshop/cart/cart.service';
import { SessionData } from 'express-session';
import { PaymentMethodService } from '~root/eshop/payment-method/services/payment-method.service';
import { ShippingMethodService } from '~root/eshop/shipping-method/services/shipping-method.service';
import { UserService } from '~root/user/services/user.service';
import { store } from '~root/state';

@Controller('api/order')
export class OrderController {
  constructor() { }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const rels = queryParams['with'] ? queryParams['with'] : [];

    return await new OrderService().findOne({ uuid }, rels);
  }

  @Patch(`:id`)
  async update(@Param('id') uuid: string, body: IGenericObject) { }

  @Post()
  async store(@Body() data: IGenericObject) { }

  @Post(`order-simulation`)
  async orderSimulation(
    @Session() session: SessionData,
    @Body() item: IGenericObject,
  ) {
    const service = new OrderService();
    let cartItem;

    const userItem = {
      firstName: 'UserF1',
      lastName: 'UserF2',
    };

    const productItem = {
      title: 'Product1',
      slug: 'product1',
    };

    const productItem2 = {
      title: 'Product2',
      slug: 'product2',
    };

    const paymentMethodItem = {
      title: 'Payment method title',
      description: 'Payment method descripton',
      status: true,
    };

    const shippingMethodItem = {
      title: 'Shipping method title',
      description: 'Shipping method descripton',
      status: true,
    };

    const user = await new UserService().store(userItem);
    const product = await new ProductService().store(productItem);
    const product2 = await new ProductService().store(productItem2);
    const paymentMethod = await new PaymentMethodService().store(
      paymentMethodItem,
    );
    const shippingMethod = await new ShippingMethodService().store(
      shippingMethodItem,
    );

    const products = [product, product2];

    await Promise.all(
      products.map(async (productItem) => {
        try {
          cartItem = await new CartService().createCartItemFromProductId(
            product.uuid,
            product.quantity,
            product.variantId,
            user.uuid,
          );
        } catch (e) {
          console.log(e);
          return { success: false, reason: 'ProductNotFound' };
        }

        try {
          session.cart.add(cartItem);
        } catch (e) {
          console.log(e);
        }
      }),
    );

    await session.cart.save();

    const order = await service.store({
      status: 1,
      paymentMethod: paymentMethod.title,
      shippingMethod: shippingMethod.title,
    });

    await service.attachModelToAnotherModel(
      store.getState().models['Order'],
      {
        uuid: order.uuid,
      },
      store.getState().models['PaymentMethod'],
      {
        uuid: paymentMethod.uuid,
      },
      'paymentMethod',
    );

    await service.attachModelToAnotherModel(
      store.getState().models['Order'],
      {
        uuid: order.uuid,
      },
      store.getState().models['ShippingMethod'],
      {
        uuid: shippingMethod.uuid,
      },
      'shippingMethod',
    );

    await service.attachModelToAnotherModel(
      store.getState().models['Order'],
      {
        uuid: order.uuid,
      },
      store.getState().models['User'],
      {
        uuid: user.uuid,
      },
      'user',
    );

    await Promise.all(
      products.map(async (productItem) => {
        await service.attachModelToAnotherModel(
          store.getState().models['Order'],
          {
            uuid: order.uuid,
          },
          store.getState().models['Product'],
          {
            uuid: productItem.uuid,
          },
          'product',
        );
      }),
    );

    return { success: true };
  }

  @Delete()
  async delete(@Param('id') uuid: string) { }
}
