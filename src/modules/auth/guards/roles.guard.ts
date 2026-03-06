import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/schemas/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();

        if (!user || Object.keys(user).length === 0) {
            throw new ForbiddenException('User is not attached to request. Did you forget JwtAuthGuard?');
        }

        const hasRole = requiredRoles.some((role) => user.role?.includes(role));
        if (!hasRole) {
            throw new ForbiddenException('You do not have the required permissions for this action.');
        }
        return true;
    }
}
