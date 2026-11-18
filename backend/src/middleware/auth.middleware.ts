import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string };
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token diperlukan" });
    return;
  }

  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET as string) as {
      id: number;
      email: string;
      role: string;
    };
    (req as AuthRequest).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token tidak valid atau kadaluarsa" });
  }
};

export const role = (...allowed: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(401).json({ error: "Belum login" });
      return;
    }
    if (!allowed.includes(user.role)) {
      res.status(403).json({ error: "Akses ditolak: khusus " + allowed.join("/") });
      return;
    }
    next();
  };
};
