import mongoose, { Schema, Document } from "mongoose";

export type LogLevel = "info" | "warn" | "error" | "success";

export interface ILog extends Document {
  userId: string;
  accountId: string | null;
  accountName: string | null;
  action: string;
  details: string | null;
  level: LogLevel;
  createdAt: Date;
}

const LogSchema = new Schema<ILog>(
  {
    userId: { type: String, required: true, index: true },
    accountId: { type: String, default: null, index: true },
    accountName: { type: String, default: null },
    action: { type: String, required: true },
    details: { type: String, default: null },
    level: {
      type: String,
      enum: ["info", "warn", "error", "success"],
      default: "info",
    },
  },
  { timestamps: true, updatedAt: false },
);

export async function createLog(
  userId: string,
  action: string,
  level: LogLevel = "info",
  accountId?: string | null,
  accountName?: string | null,
  details?: string | null,
): Promise<void> {
  try {
    await LogModel.create({
      userId,
      action,
      level,
      accountId: accountId ?? null,
      accountName: accountName ?? null,
      details: details ?? null,
    });
  } catch {
    // Silently fail log creation to not block main flow
  }
}

const LogModel = mongoose.model<ILog>("Log", LogSchema);
export default LogModel;
