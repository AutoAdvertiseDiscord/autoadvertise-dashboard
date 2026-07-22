import type { Request, Response, NextFunction } from "express";
import UserModel from "../models/User";
import LicenseModel from "../models/License";

const adminIds = (process.env.ADMIN_DISCORD_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAdmin(discordId: string): boolean {
  return adminIds.includes(discordId);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export async function requireLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  // Admins bypass license check
  if (isAdmin(userId)) {
    next();
    return;
  }
  const user = await UserModel.findOne({ discordId: userId });
  if (!user?.licenseKey) {
    res.status(403).json({ error: "No active license" });
    return;
  }
  const license = await LicenseModel.findOne({ key: user.licenseKey });
  if (!license || license.status !== "active") {
    res.status(403).json({ error: "No active license" });
    return;
  }
  if (license.expiresAt && new Date() > license.expiresAt) {
    res.status(403).json({ error: "License expired" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!isAdmin(req.session.userId)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
