import {
  BaseModel,
  IBaseModelFilterConfig,
  INeo4jModel,
} from '~models/base.model';
import { McmsDi } from '../../helpers/mcms-component.decorator';
import { Injectable } from '@nestjs/common';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';
import { IAddress } from "~eshop/models/checkout";

const modelName = 'User';
@McmsDi({
  id: modelName,
  type: 'model',
})
@Injectable()
export class UserModel extends BaseModel {
  public modelName = modelName;
  public static modelName = modelName;
  public firstName?: string;
  public lastName?: string;
  public email?: string;
  public preferences?: string;
  public password?: string;
  public confirmToken?: string;
  public forgotPasswordToken?: string;
  public tempPassword?: string;
  public uuid?: string;
  public type?: 'user' | 'guest';
  public address?: IAddress[] = [];

  public static modelConfig: INeo4jModel = {
    select: 'user:User',
    as: 'user',
    relationships: {
      role: {
        model: 'Role',
        modelAlias: 'role',
        alias: 'roleRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_ROLE',
      },
      address: {
        model: 'Address',
        modelAlias: 'address',
        alias: 'addressRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_ADDRESS',
      },
      orders: {
        model: 'Order',
        modelAlias: 'order',
        alias: 'orderRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_CREATED',
      },
      isCustomer: {
        model: 'Order',
        modelAlias: 'order',
        alias: 'customerRelationship',
        type: 'normal',
        match: 'exact',
        isCollection: false,
        rel: 'HAS_CREATED',
      },
    },
  };

  public static fields: IDynamicFieldConfigBlueprint[] = [
    {
      varName: 'active',
      label: 'Status',
      placeholder: 'Status',
      isSortable: true,
      isDisplayedColumn: true,
      type: 'boolean',
      group: 'main',
    },
    {
      varName: 'email',
      label: 'Email',
      placeholder: 'Email',
      isSortable: true,
      required: true,
      isDisplayedColumn: true,
      exported: true,
      type: 'email',
      group: 'main',
    },
    {
      varName: 'firstName',
      label: 'Name',
      placeholder: 'Name',
      isSortable: true,
      required: true,
      isDisplayedColumn: true,
      exported: true,
      type: 'text',
      group: 'main',
    },
    {
      varName: 'lastName',
      label: 'Surname',
      placeholder: 'Surname',
      isSortable: true,
      required: true,
      isDisplayedColumn: true,
      exported: true,
      type: 'text',
      group: 'main',
    },
    {
      varName: 'type',
      label: 'Type',
      placeholder: 'User Type',
      isSortable: true,
      required: false,
      isDisplayedColumn: true,
      exported: true,
      type: 'text',
      group: 'main',
    },
    {
      varName: 'phone',
      label: 'Phone',
      placeholder: 'Phone',
      isSortable: true,
      required: false,
      isDisplayedColumn: true,
      exported: true,
      type: 'text',
      group: 'main',
    },
    {
      varName: 'password',
      label: 'Password',
      placeholder: 'Password',
      required: false,
      type: 'password',
      group: 'main',
    },
    {
      varName: 'verifiedAt',
      label: 'Verified At',
      placeholder: 'Verified At',
      type: 'date',
      group: 'hidden',
    },
    {
      varName: 'confirmToken',
      label: 'ConfirmToken',
      placeholder: 'ConfirmToken',
      required: false,
      type: 'text',
      group: 'hidden',
    },
    {
      varName: 'forgotPasswordToken',
      label: 'ForgotPasswordToken',
      placeholder: 'ForgotPasswordToken',
      required: false,
      type: 'text',
      group: 'hidden',
    },
  ];

  public static filterFields: IQueryBuilderFieldBlueprint[] = [
    {
      varName: 'email',
      placeholder: 'Email',
      label: 'First Email',
      type: 'text',
      relName: '',
      isInSimpleQuery: true,
      filterType: 'partial',
      model: 'User',
      filterField: '',
      order: 0,
    },
    {
      varName: 'firstName',
      placeholder: 'Name',
      label: 'First Name',
      type: 'text',
      relName: '',
      isInSimpleQuery: true,
      model: 'User',
      filterField: '',
      order: 1,
    },
    {
      varName: 'lastName',
      placeholder: 'Surname',
      label: 'Surname',
      type: 'text',
      relName: '',
      isInSimpleQuery: true,
      model: 'User',
      filterField: '',
      order: 2,
    },
    {
      varName: 'guest',
      placeholder: 'Guest',
      label: 'Guest',
      type: 'boolean',
      relName: '',
      isInSimpleQuery: true,
      model: 'User',
      filterField: '',
      order: 2,
    },
    {
      varName: 'active',
      placeholder: 'Is Active',
      label: 'Is Active',
      type: 'boolean',
      booleanOrNull: true,
      relName: '',
      isInSimpleQuery: false,
      model: 'User',
      filterField: '',
      order: 3,
    },
    {
      varName: 'isCustomer',
      filterField: 'uuid',
      label: 'Is Customer',
      type: 'isNotNull',
      relName: 'isCustomerFilterRel',
      relType: 'normal',
      model: 'Order',
      filterType: 'exact',
      isInSimpleQuery: false,
      doNotReturnValues: true,
    },
  ];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC',
  };
}
