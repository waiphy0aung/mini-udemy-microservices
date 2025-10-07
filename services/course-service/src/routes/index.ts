import { Router } from "express";
import type { Router as RouterType } from "express";
import courseRouter from "./course.route";

const router: RouterType = Router();

router.use("/courses", courseRouter)

export default router;
