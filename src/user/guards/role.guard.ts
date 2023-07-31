import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from "@nestjs/core";
import { UserService } from "~user/services/user.service";

export interface IRoleGuardReflectorOptions {
  roles: string[];
  match: 'min' | 'max' | 'any';
}

/**
 * This guard is used to check if the user has the required role to access the route
 * Usage:
 * @SetMetadata('roles', {roles: ['admin'], match : 'min'}) Will check if the user has the admin role as a minimum role
 * @SetMetadata('roles', {roles: ['admin'], match : 'max'}) Will check if the user has the admin role as a maximum role
 * @SetMetadata('roles', {roles: ['admin', 'editor'], match : 'any'}) Will check if the user has any of the roles
 * @UseGuards(RoleGuard)
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {

  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const options = this.reflector.get<IRoleGuardReflectorOptions>('roles', context.getHandler());
    const roles = options.roles;
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (!Array.isArray(request.session.user.role)) {
      return false;
    }


    if (options.match === 'any') {
      const foundRoles = [];
      request.session.user.role.forEach(role => {
        if (roles.indexOf(role.name) !== -1) {
          foundRoles.push(role);
          return;
        }
      });

      return foundRoles.length > 0;
    }

    let authorized = false;

    if (options.match === 'min') {
      const minRole = UserService.userMinLevel(request.session.user);
      request.session.user.role.forEach(role => {
        if (role.level >= minRole.level) {
          authorized = true;
        }
      });

    }

    if (options.match === 'max') {
      const maxRole = UserService.userMaxLevel(request.session.user);
       request.session.user.role.forEach(role => {
        if (role.level <= maxRole.level) {
          authorized = true;
        }
       });
    }

    return authorized;
  }
}
