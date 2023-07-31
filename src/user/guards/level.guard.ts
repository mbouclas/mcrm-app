import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from "@nestjs/core";
import { UserService } from "~user/services/user.service";
export interface ILevelGuardReflectorOptions {
  level: number;
  match: 'min' | 'max';
}

/**
 * This guard is used to check if the user has the required role to access the route
 * Usage:
 * @SetMetadata('level', {level: 30, match : 'min'}) Will check if the user has the admin role as a minimum role
 * @SetMetadata('level', {level: 30, match : 'max'}) Will check if the user has the admin role as a maximum role
 * @UseGuards(LevelGuard)
 */
@Injectable()
export class LevelGuard implements CanActivate {
  constructor(private reflector: Reflector) {

  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
  const options = this.reflector.get<ILevelGuardReflectorOptions>('level', context.getHandler());

    let authorized = false;
    const request = context.switchToHttp().getRequest();
    const maxRole = UserService.userMaxRole(request.session.user);

    if (options.match === 'min') {

      if (maxRole.level >= options.level) {
        authorized = true;
      }
    }

    if (options.match === 'max') {
      if (maxRole.level <= options.level) {
        authorized = true;
      }
    }


    return authorized;
  }
}
