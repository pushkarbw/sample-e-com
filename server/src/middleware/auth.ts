import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../models';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required'
    });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here';
    const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here';
      const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we continue without user info
    }
  }
  
  next();
};