import { Body, Controller, Post } from "@nestjs/common";
import { IsNotEmpty } from "class-validator";
import { ModelManagerService } from "~root/model-manager/model-manager.service";
import BaseHttpException from "~shared/exceptions/base-http-exception";

class FieldDto {
  @IsNotEmpty()
  varName: string;

  @IsNotEmpty()
  label: string;

  @IsNotEmpty()
  placeholder: string;

  @IsNotEmpty()
  type: string;
}

class PostedFieldDto {
  @IsNotEmpty()
  modelName: string;

  @IsNotEmpty()
  field: FieldDto;
}



@Controller('api/model-manager')
export class ModelManagerController {
  @Post('sync')
  async sync(@Body() data: PostedFieldDto) {
    const s = new ModelManagerService();

    try {
      await s.sync(data.modelName, data.field);
    }
    catch (e) {
      console.log(e)
      throw new BaseHttpException({
        error: e.getMessage(),
        reason: 'Validation errors',
        code: e.getCode(),
        statusCode: 500,
        validationErrors: e.getErrors(),
      });
    }

    return {success: true};
  }
}
