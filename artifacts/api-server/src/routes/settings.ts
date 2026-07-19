import { Router, type IRouter } from "express";
import { requireAuth, requireLicense } from "../lib/auth";
import SettingsModel, { getOrCreateSettings } from "../models/Settings";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatSettings(s: InstanceType<typeof SettingsModel>) {
  return {
    id: s._id.toString(),
    globalCooldown: s.globalCooldown,
    maxAccounts: s.maxAccounts,
    notificationsEnabled: s.notificationsEnabled,
    webhookUrl: s.webhookUrl,
  };
}

router.get("/settings", requireAuth, requireLicense, async (req, res): Promise<void> => {
  const settings = await getOrCreateSettings(req.session.userId!);
  res.json(formatSettings(settings));
});

router.put("/settings", requireAuth, requireLicense, async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settings = await SettingsModel.findOneAndUpdate(
    { userId: req.session.userId },
    parsed.data,
    { new: true, upsert: true },
  );

  res.json(formatSettings(settings!));
});

export default router;
