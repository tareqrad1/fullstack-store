import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}


export function protectedRoute(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ message: "JWT_SECRET is not set" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as { sub: string; role: string };
    req.user = { id: payload.sub, role: payload.role };

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}