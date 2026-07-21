import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  discordId: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email: string | null;
  accessToken: string;
  refreshToken: string | null;
  licenseKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    discordId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    discriminator: { type: String, default: "0" },
    avatar: { type: String, default: null },
    email: { type: String, default: null },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, default: null },
    licenseKey: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>("User", UserSchema);
