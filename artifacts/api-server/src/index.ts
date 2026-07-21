import app from "./app";
import { logger } from "./lib/logger";
import { connectMongoDB } from "./lib/mongodb";
import { resumeActiveAccounts } from "./lib/advertiser";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  // Connect to MongoDB
  await connectMongoDB();

  // Resume any accounts that were running before server restart
  await resumeActiveAccounts();

  // Note: Discord bot runs separately on Railway — do not start it here
  // to avoid dual-bot conflicts on the same token.

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "AutoAdvertise API server listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
