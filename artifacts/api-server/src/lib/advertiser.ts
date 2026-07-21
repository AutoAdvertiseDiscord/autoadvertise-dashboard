import axios from "axios";
import AccountModel, { type IAccount } from "../models/Account";
import { createLog } from "../models/Log";
import { logger } from "./logger";

// Map of accountId -> interval handle
const activeIntervals = new Map<string, ReturnType<typeof setTimeout>>();

async function sendDiscordMessage(
  token: string,
  channelId: string,
  content: string,
  imageUrl?: string | null,
): Promise<void> {
  const body: Record<string, unknown> = { content };
  if (imageUrl) {
    body.embeds = [{ image: { url: imageUrl } }];
  }
  await axios.post(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    body,
    {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    },
  );
}

async function runAccountCycle(accountId: string): Promise<void> {
  const account = await AccountModel.findById(accountId);
  if (!account || account.status !== "running") {
    stopAccount(accountId);
    return;
  }
  if (!account.channelIds.length || !account.messages.length) {
    await AccountModel.findByIdAndUpdate(accountId, {
      status: "error",
      errorMessage: "No channels or messages configured",
    });
    stopAccount(accountId);
    return;
  }

  const channelId = account.channelIds[account.currentChannelIndex % account.channelIds.length];
  const message = account.messages[account.currentMessageIndex % account.messages.length];

  try {
    await sendDiscordMessage(account.discordToken, channelId, message, account.imageUrl);
    const nextChannelIdx = (account.currentChannelIndex + 1) % account.channelIds.length;
    const nextMsgIdx = (account.currentMessageIndex + 1) % account.messages.length;
    await AccountModel.findByIdAndUpdate(accountId, {
      lastMessageAt: new Date(),
      $inc: { totalMessagesSent: 1 },
      currentChannelIndex: nextChannelIdx,
      currentMessageIndex: nextMsgIdx,
      errorMessage: null,
    });
    await createLog(account.userId, `Message sent in channel ${channelId}`, "success", accountId, account.name, message.substring(0, 100));
  } catch (err: unknown) {
    const errMsg = axios.isAxiosError(err)
      ? `Discord API error ${err.response?.status}: ${JSON.stringify(err.response?.data)}`
      : "Unknown error sending message";
    logger.warn({ err, accountId }, "Failed to send Discord message");
    await createLog(account.userId, `Failed to send message`, "error", accountId, account.name, errMsg);

    const statusCode = axios.isAxiosError(err) ? err.response?.status : null;
    if (statusCode === 401 || statusCode === 403) {
      await AccountModel.findByIdAndUpdate(accountId, {
        status: "error",
        errorMessage: "Invalid or unauthorized Discord token",
      });
      stopAccount(accountId);
      await createLog(account.userId, `Account stopped: invalid token`, "error", accountId, account.name);
    }
  }
}

export function startAccount(accountId: string, cooldownSeconds: number): void {
  if (activeIntervals.has(accountId)) return;
  const interval = setInterval(() => {
    runAccountCycle(accountId).catch((err) => {
      logger.error({ err, accountId }, "Error in account cycle");
    });
  }, cooldownSeconds * 1000);
  activeIntervals.set(accountId, interval);
  // Run immediately on first start
  runAccountCycle(accountId).catch((err) => {
    logger.error({ err, accountId }, "Error in initial account cycle");
  });
}

export function stopAccount(accountId: string): void {
  const interval = activeIntervals.get(accountId);
  if (interval) {
    clearInterval(interval);
    activeIntervals.delete(accountId);
  }
}

export function isAccountRunning(accountId: string): boolean {
  return activeIntervals.has(accountId);
}

export async function resumeActiveAccounts(): Promise<void> {
  const activeAccounts = await AccountModel.find({ status: "running" });
  for (const account of activeAccounts) {
    startAccount(account.id as string, account.cooldown);
    logger.info({ accountId: account.id, name: account.name }, "Resumed active account");
  }
  logger.info({ count: activeAccounts.length }, "Resumed active accounts from database");
}
