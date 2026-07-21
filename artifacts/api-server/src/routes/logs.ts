import { Router, type IRouter } from "express";
import LogModel from "../models/Log";
import { requireAuth, requireLicense } from "../lib/auth";
import { GetLogsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/logs", requireAuth, requireLicense, async (req, res): Promise<void> => {
  const parsed = GetLogsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit = 50, offset = 0, accountId, level } = parsed.data;
  const filter: Record<string, unknown> = { userId: req.session.userId };

  if (accountId) filter.accountId = accountId;
  if (level) filter.level = level;

  const [logs, total] = await Promise.all([
    LogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit),
    LogModel.countDocuments(filter),
  ]);

  res.json({
    logs: logs.map((l) => ({
      id: l._id.toString(),
      accountId: l.accountId,
      accountName: l.accountName,
      action: l.action,
      details: l.details,
      level: l.level,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
  });
});

export default router;
