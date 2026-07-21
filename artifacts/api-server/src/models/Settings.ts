import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  userId: string;
  globalCooldown: number;
  maxAccounts: number;
  notificationsEnabled: boolean;
  webhookUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    globalCooldown: { type: Number, default: 30 },
    maxAccounts: { type: Number, default: 10 },
    notificationsEnabled: { type: Boolean, default: true },
    webhookUrl: { type: String, default: null },
  },
  { timestamps: true },
);

export async function getOrCreateSettings(userId: string): Promise<ISettings> {
  let settings = await SettingsModel.findOne({ userId });
  if (!settings) {
    settings = await SettingsModel.create({ userId });
  }
  return settings;
}

const SettingsModel = mongoose.model<ISettings>("Settings", SettingsSchema);
export default SettingsModel;
