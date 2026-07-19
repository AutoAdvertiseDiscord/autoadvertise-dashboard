import { Router, type IRouter } from "express";
import AccountModel from "../models/Account";
import { requireAuth, requireLicense } from "../lib/auth";
import { createLog } from "../models/Log";
import {
  CreateAccountBody,
  UpdateAccountBody,
  GetAccountParams,
  UpdateAccountParams,
  DeleteAccountParams,
  StartAccountParams,
  StopAccountParams,
  TestAccountParams,
} from "@workspace/api-zod";
import {
  startAccount as startAdvertiser,
  stopAccount as stopAdvertiser,
} from "../lib/advertiser";
import axios from "axios";

const router: IRouter = Router();

function formatAccount(acc: ReturnType<(typeof AccountModel.prototype.toObject)> | any) {
  return {
    id: acc._id.toString(),
    name: acc.name,
    status: acc.status,
    channelIds: acc.channelIds,
    messages: acc.messages,
    cooldown: acc.cooldown,
    imageUrl: acc.imageUrl,
    lastMessageAt: acc.lastMessageAt?.toISOString() ?? null,
    totalMessagesSent: acc.totalMessagesSent,
    errorMessage: acc.errorMessage,
    createdAt: acc.createdAt.toISOString(),
    updatedAt: acc.updatedAt.toISOString(),
  };
}

router.get("/accounts", requireAuth, requireLicense, async (req, res): Promise<void> => {
  const accounts = await AccountModel.find({ userId: req.session.userId }).sort({ createdAt: -1 });
  res.json(accounts.map(formatAccount));
});

router.post("/accounts", requireAuth, requireLicense, async (req, res): Promise<void> => {
  const parsed = CreateAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const account = await AccountModel.create({
    userId: req.session.userId,
    ...parsed.data,
  });

  await createLog(req.session.userId!, `Account created: ${account.name}`, "info", account.id, account.name);
  res.status(201).json(formatAccount(account));
});

router.get("/accounts/:id", requireAuth, requireLicense, async (req, res): Promise<void> => {
  const params = GetAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const account = await AccountModel.findOne({
    _id: params.data.id,
    userId: req.session.userId,
  });

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json(formatAccount(account));
});

router.put("/accounts/:id", requireAuth, requireLicense, async (req, res): Promise<void> => {
  const params = UpdateAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const account = await AccountModel.findOneAndUpdate(
    { _id: params.data.id, userId: req.session.userId },
    parsed.data,
    { new: true },
  );

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  // If account is running and cooldown changed, restart it
  if (parsed.data.cooldown && account.status === "running") {
    stopAdvertiser(account.id as string);
    startAdvertiser(account.id as string, account.cooldown);
  }

  await createLog(req.session.userId!, `Account updated: ${account.name}`, "info", account.id, account.name);
  res.json(formatAccount(account));
});

router.delete("/accounts/:id", requireAuth, requireLicense, async (req, res): Promise<void> => {
  const params = DeleteAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const account = await AccountModel.findOneAndDelete({
    _id: params.data.id,
    userId: req.session.userId,
  });

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  stopAdvertiser(account.id as string);
  await createLog(req.session.userId!, `Account deleted: ${account.name}`, "warn", null, account.name);
  res.sendStatus(204);
});

router.post("/accounts/:id/start", requireAuth, requireLicense, async (req, res): Promise<void> => {
  const params = StartAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const account = await AccountModel.findOne({
    _id: params.data.id,
    userId: req.session.userId,
  });

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  if (!account.channelIds.length || !account.messages.length) {
    res.status(400).json({ error: "Account needs at least one channel ID and one message" });
    return;
  }

  await AccountModel.findByIdAndUpdate(account._id, {
    status: "running",
    errorMessage: null,
  });

  startAdvertiser(account.id as string, account.cooldown);
  await createLog(req.session.userId!, `Account started: ${account.name}`, "success", account.id, account.name);

  const updated = await AccountModel.findById(account._id);
  res.json(formatAccount(updated));
});

router.post("/accounts/:id/stop", requireAuth, requireLicense, async (req, res): Promise<void> => {
  const params = StopAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const account = await AccountModel.findOneAndUpdate(
    { _id: params.data.id, userId: req.session.userId },
    { status: "stopped" },
    { new: true },
  );

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  stopAdvertiser(account.id as string);
  await createLog(req.session.userId!, `Account stopped: ${account.name}`, "info", account.id, account.name);
  res.json(formatAccount(account));
});

router.post("/accounts/:id/test", requireAuth, requireLicense, async (req, res): Promise<void> => {
  const params = TestAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const account = await AccountModel.findOne({
    _id: params.data.id,
    userId: req.session.userId,
  });

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  if (!account.channelIds.length || !account.messages.length) {
    res.status(400).json({ error: "Account needs at least one channel ID and one message" });
    return;
  }

  const channelId = account.channelIds[0];
  const message = account.messages[0];
  const body: Record<string, unknown> = { content: message };
  if (account.imageUrl) {
    body.embeds = [{ image: { url: account.imageUrl } }];
  }

  try {
    await axios.post(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      body,
      {
        headers: {
          Authorization: account.discordToken,
          "Content-Type": "application/json",
        },
      },
    );
    await createLog(req.session.userId!, `Test message sent for: ${account.name}`, "success", account.id, account.name);
    res.json({ message: "Test message sent successfully" });
  } catch (err) {
    const errMsg = axios.isAxiosError(err)
      ? `Error ${err.response?.status}: ${JSON.stringify(err.response?.data)}`
      : "Failed to send test message";
    await createLog(req.session.userId!, `Test message failed for: ${account.name}`, "error", account.id, account.name, errMsg);
    res.status(400).json({ error: errMsg });
  }
});

export default router;
