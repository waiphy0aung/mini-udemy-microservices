import { auth, cache, validate } from "@shared";
import { Router } from "express";
import type { Router as RouterType } from "express";
import * as courseController from "../controllers/course.controller"
import * as courseValidations from "../validations/course.validation"

const courseRouter: RouterType = Router();

courseRouter.get(
  "/",
  validate(courseValidations.getCoursesQuerySchema),
  cache({ prefix: "courses:list", ttl: 300 }),
  courseController.getAllCourses
)

courseRouter.get(
  "/:id",
  cache({ prefix: "courses:detail", ttl: 300 }),
  courseController.getCourse
)

courseRouter.post(
  "/",
  auth(["INSTRUCTOR", "ADMIN"]),
  validate(courseValidations.createCourseSchema),
  courseController.createCourse
)

courseRouter.get(
  "/instructor/my-courses",
  auth(["INSTRUCTOR", "ADMIN"]),
  validate(courseValidations.getCoursesQuerySchema),
  courseController.getInstructorCourses
)

courseRouter.put(
  "/:id",
  auth(["INSTRUCTOR", "ADMIN"]),
  validate(courseValidations.updateCourseSchema),
  courseController.updateCourse
)

courseRouter.delete(
  "/:id",
  auth(["INSTRUCTOR", "ADMIN"]),
  courseController.deleteCourse
)

courseRouter.post(
  "/:id/publish",
  auth(["INSTRUCTOR", "ADMIN"]),
  courseController.publishCourse
)

courseRouter.post(
  "/:id/archive",
  auth(["INSTRUCTOR", "ADMIN"]),
  courseController.archiveCourse
)

export default courseRouter;
