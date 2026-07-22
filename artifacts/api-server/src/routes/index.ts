import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import licenseRouter from "./license";
import accountsRouter from "./accounts";
import logsRouter from "./logs";
import settingsRouter from "./settings";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(licenseRouter);
router.use(accountsRouter);
router.use(logsRouter);
router.use(settingsRouter);
router.use(dashboardRouter);
router.use(adminRouter);

export default router;
