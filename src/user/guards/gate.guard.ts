import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserService } from "~user/services/user.service";

@Injectable()
export class GateGuard implements CanActivate {
  constructor(private reflector: Reflector) {

  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const gates = this.reflector.get<string[]>('gates', context.getHandler());

    if (!gates) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (!Array.isArray(request.session.user.gates)) {
      return false;
    }

    return UserService.inGates(request.session.user, gates);
  }
}
