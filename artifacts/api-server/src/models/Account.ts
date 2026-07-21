import mongoose, { Schema, Document } from "mongoose";

export type AccountStatus = "running" | "stopped" | "error" | "pending";

export interface IAccount extends Document {
  userId: string; // Discord user ID of owner
  name: string;
  discordToken: string; // User's Discord token for sending messages
  channelIds: string[];
  messages: string[];
  cooldown: number; // seconds between messages
  imageUrl: string | null;
  status: AccountStatus;
  lastMessageAt: Date | null;
  totalMessagesSent: number;
  errorMessage: string | null;
  currentChannelIndex: number;
  currentMessageIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    discordToken: { type: String, required: true },
    channelIds: { type: [String], default: [] },
    messages: { type: [String], default: [] },
    cooldown: { type: Number, required: true, default: 60 },
    imageUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ["running", "stopped", "error", "pending"],
      default: "stopped",
    },
    lastMessageAt: { type: Date, default: null },
    totalMessagesSent: { type: Number, default: 0 },
    errorMessage: { type: String, default: null },
    currentChannelIndex: { type: Number, default: 0 },
    currentMessageIndex: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model<IAccount>("Account", AccountSchema);
