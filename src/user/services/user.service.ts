import { McmsDi } from '~helpers/mcms-component.decorator';
import { Injectable } from '@nestjs/common';
import { IGenericObject, IPagination } from '~models/general';
import { store } from '~root/state';
import { UserModel } from '~user/models/user.model';
import { BaseNeoService } from '~shared/services/base-neo.service';
import { OnEvent } from '@nestjs/event-emitter';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ChangeLogService } from '~change-log/change-log.service';
import { AuthService } from '~root/auth/auth.service';
import { MailService } from '~root/mail/services/mail.service';
import { GateService } from '~root/auth/gate.service';

export class UserModelDto {
  tempUuid?: string;
  uuid?: string;
  password?: string;

  @IsNotEmpty()
  firstName?: string;

  @IsNotEmpty()
  lastName?: string;

  @IsNotEmpty()
  @IsEmail()
  email?: string;

  active?: boolean;
  confirmToken?: string;
  forgotPasswordToken?: string;
  type?: 'user' | 'guest' = 'user';
}

@McmsDi({
  id: 'UserService',
  type: 'service',
})
@Injectable()
export class UserService extends BaseNeoService {
  protected relationships = [];
  protected model: typeof UserModel;
  protected changeLog: ChangeLogService;
  protected auth: AuthService;
  protected mail: MailService;
  static updatedEventName = 'user.model.updated';
  static createdEventName = 'user.model.created';
  static deletedEventName = 'user.model.deleted';

  constructor() {
    super();
    this.model = store.getState().models.User;
    this.changeLog = new ChangeLogService();
    this.auth = new AuthService();
    this.mail = new MailService();
  }

  @OnEvent('app.loaded')
  async onAppLoaded() {
    // const s = new UserService();
    // const r = await s.findOne({email: 'mbouclas@gmail.com'}, ['*']);
    // const r = await s.find({email: 'mbouclas@gmail.com', with: ['*']});
    // const r = await s.store({email: 'bobo@gmail.com', firstName: 'Bozo', lastName: 'Bobos'});
    // const r = await s.update('5e43d24c-a96f-4f1c-a1d1-fb6b46b1823f',{password: await this.generatePasswordHash('magicj')});
    // console.log(r)
  }

  @OnEvent(UserService.createdEventName)
  async onStore(payload: UserModel) {
    console.log(`in ${UserService.createdEventName} event`, payload);
  }

  @OnEvent('user.created')
  async confirmEmail(payload: UserModel) {
    await this.mail.send({
      from: '0xdjole@gmail.com',
      to: payload.email,
      subject: 'Confirm email',
      text: `Use me ${payload.confirmToken}`,
    });
  }

  @OnEvent('user.forgotPassword')
  async forgotPasswordEmail(payload: UserModel) {
    await this.mail.send({
      from: '0xdjole@gmail.com',
      to: payload.email,
      subject: 'Forgot password email',
      text: `Use me ${payload.forgotPasswordToken}`,
    });
  }

  @OnEvent(UserService.updatedEventName)
  async onUpdate(payload: UserModel) {}

  @OnEvent(UserService.deletedEventName)
  async onDelete(payload: UserModel) {}

  async findOne(
    filter: IGenericObject,
    rels: string[] = [],
    extras: string[] = [],
  ): Promise<UserModel> {
    const r = await super.findOne(filter, rels);

    if (extras.indexOf('gates') !== -1) {
      r['gates'] = await new GateService().all(true, { uuid: r['uuid'] });
    }

    return r;
  }

  async find(params: IGenericObject = {}): Promise<IPagination<UserModel>> {
    const r = await super.find(params);

    return r;
  }

  async store(record: UserModelDto, userId?: string) {
    if (!record.type) {record.type = 'user';}
    const r = await super.store(record, userId);

    if (record.type === 'guest') {
      this.eventEmitter.emit('guest.user.created', r);
      return r;
    }

    this.eventEmitter.emit('user.created', r);
    return r;
  }

  async update(uuid: string, record: UserModelDto, userId?: string) {
    const previousState = await this.getCurrentState(
      { uuid },
      this.model.modelConfig.relationships,
      this.findOne.bind(this),
    );
    const r = await super.update(uuid, record, userId);

    // Extra updates take place here
    //  await locationService.linkModelToAllLocationTypes(business, this.modelName);

    /*
        if (business.extraFields) {
          await this.updateModelExtraFields(uuid, business.extraFields as IExtraFieldResponse, IBusinessModel.modelConfig);
        }

        if (business.tags) {
          await this.updateModelTags(uuid, business.tags as ITag[], IBusinessModel.modelConfig);
        }

        if (business.mainImage) {
          await updateModelMainImage(uuid, business.mainImage, this.modelName);
        }
    */

    if (r.type === 'guest') {
      this.eventEmitter.emit('guest.user.updated', r);
      return r;
    }

    if (!record.tempUuid) {
      const currentState = await this.getCurrentState(
        { uuid },
        this.model.modelConfig.relationships,
        this.findOne.bind(this),
      );
      await this.changeLog.add(
        this.model.modelName,
        uuid,
        'updated',
        { currentState, previousState },
        userId,
      );
    }

    this.eventEmitter.emit('user.updated', r);
    return r;
  }

  async forgotPassword(uuid: string, record: UserModelDto, userId?: string) {
    const update = await this.update(uuid, record, userId);

    this.eventEmitter.emit('user.forgotPassword', update[0]);

    return update;
  }

  async delete(uuid: string, userId?: string) {
    const r = await super.delete(uuid, userId);
    await this.changeLog.add(
      this.model.modelName,
      uuid,
      'deleted',
      null,
      userId,
    );
    return r;
  }

  async generatePasswordHash(password: string) {
    return await this.auth.hasher.hashPassword(password);
  }

  public isGuest(user: UserModel) {
    return user.type === 'guest';
  }

  public isAdmin(user: UserModel) {
    if (user.type === 'guest' || !user['role'] || !Array.isArray(user['role'])) {
      return false;
    }

    return user['role'].filter((role) => role.level > 2).length > 0;
  }
}
