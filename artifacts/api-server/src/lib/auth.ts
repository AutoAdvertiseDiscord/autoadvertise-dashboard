import type { Request, Response, NextFunction } from "express";
import UserModel from "../models/User";
import LicenseModel from "../models/License";

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

  const license = await LicenseModel.findOne({ key: user.licenseKey });
  if (!license) {
    res.status(403).json({ error: "License not found" });
    return;
  }

  // Auto-expire check
  if (license.status === "active" && license.expiresAt && new Date() > license.expiresAt) {
    await LicenseModel.findByIdAndUpdate(license._id, { status: "expired" });
    res.status(403).json({ error: "License has expired" });
    return;
  }

  if (license.status !== "active") {
    res.status(403).json({ error: "No active license" });
    return;
  }

  next();
}
