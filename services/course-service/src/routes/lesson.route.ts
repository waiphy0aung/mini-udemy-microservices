import { Router } from "express";
import type { Router as RouterType } from "express";
import { auth, cache, validate } from "@shared"
import * as lessonController from "../controllers/lesson.controller"
import * as validations from "../validations/lesson.validation"

const lessonRouter: RouterType = Router()

lessonRouter.get(
  "/sections/:sectionId/lessons",
  cache({ prefix: "lessons:list", ttl: 300 }),
  lessonController.getSectionLessons
);

lessonRouter.get(
  "/lessons/:id",
  cache({ prefix: "lessons:detail", ttl: 300 }),
  lessonController.getLessonById
)

lessonRouter.post(
  "/lessons",
  auth(["INSTRUCTOR", "ADMIN"]),
  validate(validations.createLessonSchema),
  lessonController.createLesson
)

lessonRouter.put(
  "/lessons/:id",
  auth(["INSTRUCTOR", "ADMIN"]),
  validate(validations.updateLessonSchema),
  lessonController.updateLesson
)

lessonRouter.delete(
  "/lessons/:id",
  auth(["INSTRUCTOR", "ADMIN"]),
  lessonController.deleteLesson
)

lessonRouter.post(
  "/sections/:sectionId/lessons/reorder",
  auth(["INSTRUCTOR", "ADMIN"]),
  validate(validations.reorderLessonSchema),
  lessonController.reorderLesson
)

export default lessonRouter
