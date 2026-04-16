import { Router } from "express";
import { healthRouter } from "./modules/health/health.route.js";
import { metaRouter } from "./modules/meta/meta.route.js";
import { authRouter } from "./modules/auth/auth.route.js";
import { adminRouter } from "./modules/admin/admin.route.js";
import { matchesRouter } from "./modules/matches/matches.route.js";
import { sportsRouter } from "./modules/sports/sports.route.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(metaRouter);
apiRouter.use(authRouter);
apiRouter.use(adminRouter);
apiRouter.use(matchesRouter);
apiRouter.use(sportsRouter);
