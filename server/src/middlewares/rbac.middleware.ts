import { Request, Response, NextFunction } from 'express';
import { UserRole } from './auth.middleware.js';

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthenticated. Institutional credentials required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role [${req.user.role}] lacks security clearance. Permitted: [${allowedRoles.join(', ')}].`,
      });
    }

    next();
  };
};
