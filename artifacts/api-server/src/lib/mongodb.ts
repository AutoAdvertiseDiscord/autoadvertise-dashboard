import mongoose from "mongoose";
import { logger } from "./logger";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGODB_URI!);
    isConnected = true;
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error({ err }, "Failed to connect to MongoDB");
    throw err;
  }
}

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  logger.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  logger.info("MongoDB reconnected");
});

export default mongoose;
