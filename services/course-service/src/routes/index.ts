import { Router } from "express";
import type { Router as RouterType } from "express";
import courseRouter from "./course.route";
import sectionRouter from "./section.route";
import lessonRouter from "./lesson.route";
import categoryRouter from "./category.route";

const router: RouterType = Router();

router.use(
  "/courses",
  categoryRouter,
  courseRouter,
  sectionRouter,
  lessonRouter
)

export default router;
