import { BaseModel, IBaseModelFilterConfig, INeo4jModel } from '~models/base.model';
import { McmsDi } from '../../helpers/mcms-component.decorator';
import { Injectable } from '@nestjs/common';
import { IDynamicFieldConfigBlueprint } from '~admin/models/dynamicFields';
import { IQueryBuilderFieldBlueprint } from '~shared/models/queryBuilder';
import { IAddress } from '~eshop/models/checkout';
import { IGate } from '~admin/models/gates';
import { UserService } from "~user/services/user.service";
import { GateService } from "~root/auth/gate.service";
import { UserGroupModel } from "~eshop/user-group/user-group.model";

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
  public gates?: IGate[] = [];
  public userGroup?: UserGroupModel[] = [];

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
      level: {
        model: 'Role',
        modelAlias: 'levelRel',
        exactAliasQuery: true,
        alias: 'levelRelationship',
        type: 'normal',
        match: 'exact',
        isCollection: true,
        rel: 'HAS_ROLE',
        postProcessing: async (record: Record<any, any>, model: UserModel) => {
          if (!record.levelRel || !Array.isArray(record.role)) {
            return record;
          }

          record.levelRel = UserService.userMaxRole(record as UserModel);
          record.maxLevel = record.levelRel.level;
          return record;
        }
      },
      gates: {
        model: 'Gate',
        modelAlias: 'gates',
        exactAliasQuery: true,
        alias: 'gatesRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_GATE',
        postProcessing: async (record: Record<any, any>, model: UserModel) => {
          // This is a virtual relationship, we don't expect any results as there's no connection between user and gate
          // record.gates = await new GateService().all(true, { uuid: record['uuid'] });
          if (record.maxLevel) {
            record.gates = GateService.userGates(record.maxLevel, await new GateService().all(true));
          }

          return record;
        }
      },
      address: {
        model: 'Address',
        modelAlias: 'address',
        exactAliasQuery: true,
        alias: 'addressRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_ADDRESS',
      },
      orders: {
        model: 'Order',
        modelAlias: 'order',
        exactAliasQuery: true,
        alias: 'orderRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'HAS_CREATED',
      },
      userGroup: {
        model: 'UserGroup',
        modelAlias: 'userGroup',
        exactAliasQuery: true,
        alias: 'userGroupRelationship',
        type: 'normal',
        isCollection: true,
        rel: 'BELONGS_TO',
      },
      isCustomer: {
        model: 'Order',
        modelAlias: 'isCustomer',
        exactAliasQuery: true,
        alias: 'customerRelationship',
        type: 'normal',
        isCollection: false,
        rel: 'HAS_CREATED',
      },
      orderCount: {
        rel: 'HAS_CREATED',
        alias: 'orderCountRelationship',
        exactAliasQuery: true,
        model: 'Order',
        modelAlias: 'orderCount',
        type: 'normal',
        isCollection: false,
        isCount: true,
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
      varName: 'type',
      placeholder: 'User Type',
      label: 'User Type',
      type: 'text',
      relName: '',
      isInSimpleQuery: false,
      filterType: 'exact',
      model: 'User',
      filterField: '',
      order: 0,
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
      varName: 'level',
      filterField: 'level',
      label: 'Role Level',
      type: 'number',
      relName: 'levelFilterRel',
      relType: 'normal',
      isRange: true,
      rangeFromFieldName: 'levelFrom',
      rangeToFieldName: 'levelTo',
      model: 'Role',
      filterType: 'exact',
      isInSimpleQuery: false,
      doNotReturnValues: false,
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
    {
      varName: 'role',
      filterField: 'name',
      label: 'Role',
      type: 'string',
      relName: 'roleFilterRel',
      relType: 'inverse',
      model: 'Role',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
    {
      varName: 'createdAt',
      label: 'Created At',
      type: 'date',
      model: 'Order',
      filterType: 'exact',
      isRange: true,
      rangeFromFieldName: 'createdAtFrom',
      rangeToFieldName: 'createdAtTo',
      isInSimpleQuery: false,
    },
    {
      varName: 'userGroup',
      label: 'User Group',
      type: 'string',
      model: 'UserGroup',
      filterType: 'exact',
      isInSimpleQuery: false,
    },
  ];

  public static filterConfig: IBaseModelFilterConfig = {
    filterParamName: 'q',
    defaultOrderBy: 'createdAt',
    defaultWay: 'DESC',
  };
}
