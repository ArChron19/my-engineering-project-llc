import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import mcpRouter from "./mcp.js";
import seoRouter from "./seo.js";
import stripeRouter from "./stripe.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mcpRouter);
router.use(seoRouter);
router.use(stripeRouter);

export default router;
