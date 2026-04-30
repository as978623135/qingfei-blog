import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'qingfei-blog-secret-key-2024';

export interface AuthRequest extends Request {
  user?: { token: string };
}

export function generateToken(): string {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未授权' });
    return;
  }

  const token = authHeader.substring(7);
  if (!verifyToken(token)) {
    res.status(401).json({ error: 'token 无效或已过期' });
    return;
  }

  req.user = { token };
  next();
}
