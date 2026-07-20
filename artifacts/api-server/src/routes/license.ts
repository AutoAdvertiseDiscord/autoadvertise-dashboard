import { Router, type IRouter } from "express";
import LicenseModel from "../models/License";
import UserModel from "../models/User";
import { requireAuth } from "../lib/auth";
import { createLog } from "../models/Log";
import { RedeemLicenseBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/license/redeem", requireAuth, async (req, res): Promise<void> => {
  const parsed = RedeemLicenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { key } = parsed.data;
  const userId = req.session.userId!;

  const user = await UserModel.findOne({ discordId: userId });
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  // Check if user already has an active license
  if (user.licenseKey) {
    const existing = await LicenseModel.findOne({ key: user.licenseKey });
    if (existing && existing.status === "active") {
      if (!existing.expiresAt || new Date() < existing.expiresAt) {
        res.status(400).json({ error: "You already have an active license" });
        return;
      }
    }
  }

  const license = await LicenseModel.findOne({ key: key.toUpperCase() });
  if (!license) {
    res.status(400).json({ error: "Invalid license key" });
    return;
  }

  if (license.status === "revoked") {
    res.status(400).json({ error: "This license key has been revoked" });
    return;
  }
  if (license.status === "expired") {
    res.status(400).json({ error: "This license key has expired" });
    return;
  }
  if (license.status === "active" && license.redeemedBy) {
    res.status(400).json({ error: "This license key has already been redeemed" });
    return;
  }

  // Redeem the key
  const now = new Date();
  let expiresAt: Date | null = null;
  if (license.durationDays != null) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + license.durationDays);
  }

  await LicenseModel.findByIdAndUpdate(license._id, {
    status: "active",
    redeemedBy: userId,
    redeemedByUsername: user.username,
    redeemedAt: now,
    expiresAt,
  });

  await UserModel.findByIdAndUpdate(user._id, { licenseKey: license.key });

  await createLog(userId, `License redeemed: ${license.key}`, "success");

  const updated = await LicenseModel.findById(license._id);
  res.json({
    id: updated!._id.toString(),
    key: updated!.key,
    status: updated!.status,
    plan: updated!.plan,
    createdBy: updated!.createdBy,
    redeemedBy: updated!.redeemedBy,
    redeemedByUsername: updated!.redeemedByUsername,
    expiresAt: updated!.expiresAt?.toISOString() ?? null,
    redeemedAt: updated!.redeemedAt?.toISOString() ?? null,
    createdAt: updated!.createdAt.toISOString(),
    notes: updated!.notes,
    durationDays: updated!.durationDays,
  });
});

router.get("/license/info", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const user = await UserModel.findOne({ discordId: userId });

  if (!user || !user.licenseKey) {
    res.status(404).json({ error: "No license found" });
    return;
  }

  const license = await LicenseModel.findOne({ key: user.licenseKey });
  if (!license) {
    res.status(404).json({ error: "License not found" });
    return;
  }

  // Auto-expire check
  if (license.status === "active" && license.expiresAt && new Date() > license.expiresAt) {
    await LicenseModel.findByIdAndUpdate(license._id, { status: "expired" });
  }

  const fresh = await LicenseModel.findById(license._id);
  res.json({
    id: fresh!._id.toString(),
    key: fresh!.key,
    status: fresh!.status,
    plan: fresh!.plan,
    createdBy: fresh!.createdBy,
    redeemedBy: fresh!.redeemedBy,
    redeemedByUsername: fresh!.redeemedByUsername,
    expiresAt: fresh!.expiresAt?.toISOString() ?? null,
    redeemedAt: fresh!.redeemedAt?.toISOString() ?? null,
    createdAt: fresh!.createdAt.toISOString(),
    notes: fresh!.notes,
    durationDays: fresh!.durationDays,
  });
});

export default router;
