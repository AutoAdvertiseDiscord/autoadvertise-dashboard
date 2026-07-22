import type { Request, Response, NextFunction } from "express";

const adminIds = (process.env.ADMIN_DISCORD_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAdmin(discordId: string): boolean {
  return adminIds.includes(discordId);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!isAdmin(req.session.userId)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
