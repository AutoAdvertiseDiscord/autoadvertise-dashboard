import type { Request, Response, NextFunction } from "express";
import UserModel from "../models/User";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export async function requireLicense(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = await UserModel.findOne({ discordId: req.session.userId });
  if (!user || !user.licenseKey) {
    res.status(403).json({ error: "No active license" });
    return;
  }

  next();
}
