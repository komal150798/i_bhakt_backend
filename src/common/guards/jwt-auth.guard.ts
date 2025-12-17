import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // For public routes, try to validate token if present (optional auth)
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers?.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Token is present, try to validate it (but don't throw if invalid)
        const result = super.canActivate(context);
        
        // Handle Promise/Observable result
        if (result instanceof Promise) {
          return result.catch(() => {
            // If token is invalid, just continue without user (public route)
            return true;
          });
        }
        
        // If it's a boolean or Observable, return as is
        // The handleRequest will handle invalid tokens gracefully
        return result;
      }
      
      // No token, allow access (public route)
      return true;
    }

    // Protected route, require valid token
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // For public routes, return user if valid, or null if invalid (don't throw)
      if (err || !user) {
        return null; // Return null instead of throwing for public routes
      }
      return user;
    }

    // For protected routes, throw error if invalid
    if (err || !user) {
      // Log detailed error information for debugging
      if (err) {
        console.error('JWT Auth Error:', {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
      }
      if (info) {
        console.error('JWT Info:', {
          message: info.message,
          name: info.name,
        });
      }
      
      // Provide more specific error messages
      let errorMessage = 'Invalid or expired token';
      if (err) {
        if (err.name === 'TokenExpiredError') {
          errorMessage = 'Token has expired. Please refresh or login again.';
        } else if (err.name === 'JsonWebTokenError') {
          errorMessage = 'Invalid token format or signature.';
        } else if (err.name === 'NotBeforeError') {
          errorMessage = 'Token not yet valid.';
        } else {
          errorMessage = err.message || errorMessage;
        }
      } else if (info) {
        if (info.message === 'jwt expired') {
          errorMessage = 'Token has expired. Please refresh or login again.';
        } else if (info.message === 'jwt malformed') {
          errorMessage = 'Invalid token format.';
        } else {
          errorMessage = info.message || errorMessage;
        }
      }
      
      throw err || new UnauthorizedException(errorMessage);
    }
    return user;
  }
}
