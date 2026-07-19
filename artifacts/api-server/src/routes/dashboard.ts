import { Router, type IRouter } from "express";
import AccountModel from "../models/Account";
import LogModel from "../models/Log";
import UserModel from "../models/User";
import LicenseModel from "../models/License";
import { requireAuth, requireLicense } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, requireLicense, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const [accounts, user, last24hLogs, recentLogs] = await Promise.all([
    AccountModel.find({ userId }),
    UserModel.findOne({ discordId: userId }),
    LogModel.countDocuments({
      userId,
      level: "success",
      action: { $regex: /Message sent/ },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
    LogModel.find({ userId }).sort({ createdAt: -1 }).limit(10),
  ]);

  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.status === "running").length;
  const stoppedAccounts = accounts.filter((a) => a.status === "stopped").length;
  const errorAccounts = accounts.filter((a) => a.status === "error").length;
  const totalMessagesSent = accounts.reduce((sum, a) => sum + a.totalMessagesSent, 0);

  let licenseStatus = null;
  let licensePlan = null;
  let licenseExpiry = null;

  if (user?.licenseKey) {
    const license = await LicenseModel.findOne({ key: user.licenseKey });
    if (license) {
      licenseStatus = license.status;
      licensePlan = license.plan;
      licenseExpiry = license.expiresAt?.toISOString() ?? null;
    }
  }

  res.json({
    totalAccounts,
    activeAccounts,
    stoppedAccounts,
    errorAccounts,
    totalMessagesSent,
    messagesLast24h: last24hLogs,
    licenseStatus,
    licensePlan,
    licenseExpiry,
    recentLogs: recentLogs.map((l) => ({
      id: l._id.toString(),
      accountId: l.accountId,
      accountName: l.accountName,
      action: l.action,
      details: l.details,
      level: l.level,
      createdAt: l.createdAt.toISOString(),
    })),
  });
});

export default router;
