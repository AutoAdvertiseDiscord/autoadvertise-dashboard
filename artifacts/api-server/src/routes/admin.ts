import { Router, type IRouter } from "express";
import LicenseModel from "../models/License";
import { requireAdmin } from "../lib/auth";
import { generateLicenseKey, calculateExpiry } from "../lib/keyGenerator";
import { createLog } from "../models/Log";
const router: IRouter = Router();

// GET /admin/keys — list all keys (newest first)
router.get("/admin/keys", requireAdmin, async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 25);
  const status = req.query.status as string | undefined;

  const filter: Record<string, unknown> = {};
  if (status && ["pending", "active", "expired", "revoked"].includes(status)) {
    filter.status = status;
  }

  const [keys, total] = await Promise.all([
    LicenseModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    LicenseModel.countDocuments(filter),
  ]);

  res.json({
    keys: keys.map((k) => ({
      key: k.key,
      status: k.status,
      plan: k.plan,
      durationDays: k.durationDays,
      notes: k.notes,
      createdBy: k.createdBy,
      createdByUsername: k.createdByUsername,
      redeemedBy: k.redeemedBy,
      redeemedByUsername: k.redeemedByUsername,
      expiresAt: k.expiresAt?.toISOString() ?? null,
      redeemedAt: k.redeemedAt?.toISOString() ?? null,
      createdAt: (k as any).createdAt?.toISOString(),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// POST /admin/keys — generate one or more keys
router.post("/admin/keys", requireAdmin, async (req, res): Promise<void> => {
  const { plan, durationDays, notes, quantity: rawQty } = req.body;

  const validPlans = ["basic", "premium", "lifetime"];
  if (!validPlans.includes(plan)) {
    res.status(400).json({ error: "plan must be basic, premium, or lifetime" });
    return;
  }
  if (durationDays !== null && durationDays !== undefined && (typeof durationDays !== "number" || durationDays <= 0)) {
    res.status(400).json({ error: "durationDays must be a positive number or null" });
    return;
  }
  const quantity = Math.min(50, Math.max(1, parseInt(rawQty) || 1));
  const adminId = req.session.userId!;

  // Get admin username from DB
  const UserModel = (await import("../models/User")).default;
  const adminUser = await UserModel.findOne({ discordId: adminId });
  const adminUsername = adminUser?.username ?? adminId;

  const created = [];
  for (let i = 0; i < quantity; i++) {
    const key = generateLicenseKey();
    const license = await LicenseModel.create({
      key,
      status: "pending",
      plan,
      durationDays,
      notes: notes ?? null,
      createdBy: adminId,
      createdByUsername: adminUsername,
      redeemedBy: null,
      redeemedByUsername: null,
      expiresAt: null, // set when redeemed
      redeemedAt: null,
    });
    created.push({
      key: license.key,
      status: license.status,
      plan: license.plan,
      durationDays: license.durationDays,
      notes: license.notes,
      createdAt: license.createdAt.toISOString(),
    });
  }

  await createLog(adminId, `Admin generated ${quantity} key(s) (${plan})`, "info");

  res.status(201).json({ keys: created });
});

// DELETE /admin/keys/:key — revoke a key
router.delete("/admin/keys/:key", requireAdmin, async (req, res): Promise<void> => {
  const key = req.params.key.toUpperCase();
  const adminId = req.session.userId!;

  const license = await LicenseModel.findOne({ key });
  if (!license) {
    res.status(404).json({ error: "Key not found" });
    return;
  }

  if (license.status === "revoked") {
    res.status(400).json({ error: "Key is already revoked" });
    return;
  }

  await LicenseModel.findByIdAndUpdate(license._id, {
    status: "revoked",
    revokedBy: adminId,
    revokedAt: new Date(),
  });

  await createLog(adminId, `Admin revoked key: ${key}`, "warn");

  res.json({ message: "Key revoked" });
});

export default router;
