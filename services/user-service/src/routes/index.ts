import { Router } from "express";
import type { Router as RouterType } from "express";
import authRouter from "./auth.route";
import userRouter from "./user.route";

const router: RouterType = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter)

export default router;
