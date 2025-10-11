import { auth, cache, validate } from "@shared";
import { Router } from "express";
import type { Router as RouterType } from "express";
import * as sectionController from "../controllers/section.controller"
import * as validations from "../validations/section.validation"

const sectionRouter: RouterType = Router();

sectionRouter.get(
  "/:courseId/sections",
  cache({ prefix: "sections:list", ttl: 300 }),
  sectionController.getCourseSections
)

sectionRouter.get(
  "/sections/:id",
  cache({ prefix: "sections:detail", ttl: 300 }),
  sectionController.getSectionById
);

sectionRouter.post(
  "/sections",
  auth(["INSTRUCTOR", "ADMIN"]),
  validate(validations.createSectionSchema),
  sectionController.createSection
)

sectionRouter.put(
  "/sections/:id",
  auth(["INSTRUCTOR", "ADMIN"]),
  validate(validations.updateSectionSchema),
  sectionController.updateSection
)

sectionRouter.delete(
  "/sections/:id",
  auth(["INSTRUCTOR", "ADMIN"]),
  sectionController.deleteSection
)

sectionRouter.post(
  "/:courseId/sections/reorder",
  auth(["INSTRUCTOR", "ADMIN"]),
  validate(validations.reorderSectionSchema),
  sectionController.reorderSection
)

export default sectionRouter;
