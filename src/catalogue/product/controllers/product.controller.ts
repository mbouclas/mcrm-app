import { Body, Controller, Post, Session, Get, Delete, Param, Query, Patch } from '@nestjs/common';
import { ProductEventNames, ProductService } from "~catalogue/product/services/product.service";
import { IGenericObject } from '~models/general';
import { SessionData } from 'express-session';
import { store } from '~root/state';
import { RecordStoreFailedException } from '~shared/exceptions/record-store-failed.exception';
import {
  FailedCreate,
  FailedDelete,
  FailedToAttach,
  FailedUpdate,
  FailedToCheckDuplicateVariants,
  FailedToGenerateVariants,
  FailedToRelate,
  FailedToUpdateProductCategories,
  NotFound,
  FailedToManageCondition,
} from '../exceptions';
import errors from '../exceptions/errors';
import { z } from 'zod';
import { validateData } from '~helpers/validateData';
import { ConditionService } from '~setting/condition/services/condition.service';
import { IsArray, IsNotEmpty } from "class-validator";
import { IBulkUpdateRecord, IBulkUpdateRelationshipRecord } from "~shared/services/base-neo.service";
import { SharedModule } from "~shared/shared.module";

class PostedBulkStatusDto {
  @IsArray()
  @IsNotEmpty()
  records: Partial<IBulkUpdateRecord>[];
}

class PostedNewProductDto {
  @IsNotEmpty()
  title: string;
}

class PostedBulkSalesChannelDto {
  @IsArray()
  @IsNotEmpty()
  ids: string[];

  @IsNotEmpty()
  action: 'add' | 'remove';

  @IsNotEmpty()
  salesChannelId: string;
}



const productSchema = z.object({
  title: z
    .string({ required_error: errors.TITLE_REQUIRED.code, invalid_type_error: errors.TITLE_REQUIRED.code })
    .min(1, errors.TITLE_REQUIRED.code),
  sku: z
    .string({ required_error: errors.SKU_REQUIRED.code, invalid_type_error: errors.SKU_REQUIRED.code })
    .min(1, errors.SKU_REQUIRED.code),

});

@Controller('api/product')
export class ProductController {
  constructor() {}

  onApplicationBootstrap() {
    setTimeout(async () => {});
  }

  @Get('ids')
  async getIds(@Query() queryParams = {}) {
    queryParams['onlyPrimaryModelIds'] = true;
    const res = await new ProductService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);

    return res.data.map(m => m.uuid);
  }

  @Patch('bulk/update')
  async bulkStatus(@Body() body: PostedBulkStatusDto) {
    const res = await new ProductService().bulkUpdate(body.records);
    SharedModule.eventEmitter.emit(ProductEventNames.bulkUpdate, body.records.map(r => r.uuid));

    return res;
  }

  @Patch('bulk/category')
  async bulkCategoryEdit(@Body() data: Partial<IBulkUpdateRelationshipRecord>[]) {

    return await new ProductService().bulkUpdateRelationships(data, 'HAS_CATEGORY');
  }

  @Patch('bulk/sales-channel')
  async bulkSalesChannelEdit(@Body() data: Partial<IBulkUpdateRelationshipRecord>[]) {
    return await new ProductService().bulkUpdateRelationships(data, 'BELONGS_TO');
  }

  @Get('')
  async find(@Query() queryParams = {}) {
    return await new ProductService().find(queryParams, Array.isArray(queryParams['with']) ? queryParams['with'] : []);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    try {
      const rels = queryParams['with'] ? queryParams['with'] : [];

      return await new ProductService().findOne({ uuid }, rels);
    } catch (e) {
      throw new NotFound();
    }
  }

  @Delete(':uuid')
  async delete(@Session() session: SessionData, @Param('uuid') uuid: string) {
    try {
      const userId = session.user && session.user['uuid'];

      return await new ProductService().delete(uuid, userId);
    } catch (e) {
      throw new FailedDelete();
    }
  }

  @Post(':uuid/generate-variants')
  async generateVariants(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    const propertyValues = body['propertyValues'];
    if (!propertyValues || !propertyValues.length) {
      throw new FailedToGenerateVariants();
    }

    try {
      await new ProductService().generateVariantsFromProperty(uuid, propertyValues, body.duplicateVariants || {});
      return { success: true };
    } catch (e) {
      throw new FailedToGenerateVariants();
    }
  }

  @Get(':uuid/check-duplicate-variants')
  async checkDuplicateVariants(@Param('uuid') uuid: string, @Query() queryParams = {}) {
    const propertyValues = queryParams['propertyValues'] ? queryParams['propertyValues'] : [];

    if (!propertyValues || !propertyValues.length) {
      return { success: false };
    }

    try {
      const result = await new ProductService().checkDuplicateVariants(uuid, propertyValues);
      return { ...result, success: true };
    } catch (e) {
      throw new FailedToCheckDuplicateVariants();
    }
  }

  @Post('')
  async create(@Body() body: PostedNewProductDto) {
    try {
      return await new ProductService().store(body);

    } catch (e) {
      throw new FailedCreate();
    }
  }

  @Patch(':uuid')
  async patch(@Body() body: IGenericObject, @Param('uuid') uuid: string) {
    await validateData(body, productSchema);

    try {
      const rels = [];

      if (body.manufacturer) {
        rels.push({
          id: body.manufacturer.uuid,
          name: 'manufacturer',
        });
      }

      if (body.pageCategory) {
        for (const category of body.pageCategory) {
          rels.push({
            id: category.uuid,
            name: 'productCategory',
          });
        }
      }

      if (body.tag) {
        for (const tag of body.tag) {
          rels.push({
            id: tag.uuid,
            name: 'tag',
          });
        }
      }

      if (!body.price || body.price === 'P.O.R.') {
        body.price = null;
      }

      await new ProductService().update(uuid, body, null, rels, { clearExistingRelationships: true });

      return { success: true };
    } catch (e) {
      throw new FailedUpdate();
    }
  }

  @Post(':uuid/attach')
  async addToProduct(@Param('uuid') uuid: string, @Body() body: IGenericObject) {
    try {
      const relationships = store.getState().models['Product'].modelConfig.relationships;

      const targetRelationship = relationships[body.targetModel];
      if (!targetRelationship) {
        throw new RecordStoreFailedException('Invalid target model');
      }

      const response = await new ProductService().attachToModelById(uuid, body.targetId, targetRelationship.modelAlias);

      return response;
    } catch (e) {
      throw new FailedToAttach();
    }
  }

  @Patch('/:uuid/productCategories')
  async updateProductCategories(@Param('uuid') uuid: string, @Body() ids: IGenericObject[]) {
    try {
      await new ProductService().updateProductCategories(
        uuid,
        ids.map((i) => i['uuid']),
      );
      return { success: true };
    } catch (e) {
      throw new FailedToUpdateProductCategories();
    }
  }

  @Post('/manage-relate')
  async relateProduct(@Body() body: IGenericObject) {
    try {
      for (const destinationUuid of body.destinationUuids) {
        await new ProductService().findOne({ uuid: body.sourceUuid });
        await new ProductService().findOne({ uuid: destinationUuid });

        if (body.type === 'relate') {
          await new ProductService().attachToModelById(body.sourceUuid, destinationUuid, 'related');
        } else {
          await new ProductService().detachFromModelById(body.sourceUuid, destinationUuid, 'related');
        }
      }
      SharedModule.eventEmitter.emit(ProductEventNames.productUpdated, { uuid: body.sourceUuid });
      return { success: true };
    } catch (e) {
      throw new FailedToRelate();
    }
  }

  @Post('/manage-cart-condition')
  async manageCartCondition(@Body() body: IGenericObject) {
    try {
      const product = await new ProductService().findOne({ uuid: body.sourceUuid }, ['cartCondition']);

      await new ConditionService().findOne({ uuid: body.destinationUuid });

      if (body.type === 'attachCondition') {
        const maxOrderValue = product?.cartCondition.reduce(
          (maxOrder, currentObj) =>
            currentObj.relationship && currentObj.relationship.order > maxOrder
              ? currentObj.relationship.order
              : maxOrder,
          -1,
        );
        await new ProductService().attachToModelById(body.sourceUuid, body.destinationUuid, 'cartCondition', {
          order: maxOrderValue + 1,
        });
      } else {
        await new ProductService().detachFromModelById(body.sourceUuid, body.destinationUuid, 'cartCondition');
      }

      return { success: true };
    } catch (e) {
      console.log('error ', e);
      throw new FailedToManageCondition();
    }
  }
}
