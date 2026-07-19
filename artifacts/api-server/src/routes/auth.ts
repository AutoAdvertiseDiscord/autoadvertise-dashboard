import { Router, type IRouter } from "express";
import axios from "axios";
import UserModel from "../models/User";
import LicenseModel from "../models/License";
import { createLog } from "../models/Log";

const router: IRouter = Router();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;

function getRedirectUri(req: ReturnType<typeof Router>["request"] | any): string {
  const host = req.get("host") || "";
  const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
  return `${protocol}://${host}/api/auth/discord/callback`;
}

router.get("/auth/discord", (req, res): void => {
  const redirectUri = getRedirectUri(req);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email",
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

router.get("/auth/discord/callback", async (req, res): Promise<void> => {
  const { code } = req.query;
  if (!code || typeof code !== "string") {
    res.redirect("/?error=missing_code");
    return;
  }

  const redirectUri = getRedirectUri(req);

  try {
    // Exchange code for tokens
    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const { access_token, refresh_token } = tokenRes.data;

    // Get Discord user info
    const userRes = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const discordUser = userRes.data;

    // Upsert user in DB
    const user = await UserModel.findOneAndUpdate(
      { discordId: discordUser.id },
      {
        discordId: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator || "0",
        avatar: discordUser.avatar || null,
        email: discordUser.email || null,
        accessToken: access_token,
        refreshToken: refresh_token || null,
      },
      { upsert: true, new: true },
    );

    req.session.userId = discordUser.id;
    await createLog(discordUser.id, "User logged in", "info");

    // Check if user has license
    if (user.licenseKey) {
      // Check license status
      const license = await LicenseModel.findOne({ key: user.licenseKey });
      if (license && license.status === "active") {
        if (license.expiresAt && new Date() > license.expiresAt) {
          await LicenseModel.findByIdAndUpdate(license._id, { status: "expired" });
          res.redirect("/redeem?reason=expired");
          return;
        }
        res.redirect("/dashboard");
        return;
      }
    }

    res.redirect("/redeem");
  } catch (err) {
    req.log.error({ err }, "Discord OAuth callback error");
    res.redirect("/?error=oauth_failed");
  }
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = await UserModel.findOne({ discordId: req.session.userId });
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "User not found" });
    return;
  }

  let licenseStatus = null;
  let licenseExpiry = null;
  let licensePlan = null;
  let hasLicense = false;

  if (user.licenseKey) {
    const license = await LicenseModel.findOne({ key: user.licenseKey });
    if (license) {
      // Auto-expire
      if (license.status === "active" && license.expiresAt && new Date() > license.expiresAt) {
        await LicenseModel.findByIdAndUpdate(license._id, { status: "expired" });
        licenseStatus = "expired";
      } else {
        licenseStatus = license.status;
      }
      licenseExpiry = license.expiresAt ? license.expiresAt.toISOString() : null;
      licensePlan = license.plan;
      hasLicense = license.status === "active";
    }
  }

  res.json({
    id: user._id.toString(),
    discordId: user.discordId,
    username: user.username,
    avatar: user.avatar,
    hasLicense,
    licenseStatus,
    licenseExpiry,
    licensePlan,
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

export default router;
