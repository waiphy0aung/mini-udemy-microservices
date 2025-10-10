import { Router } from "express";
import type { Router as RouterType } from "express";
import * as validations from "../validations/enrollment.validation";
import * as enrollmentController from "../controllers/enrollment.controller"
import { auth, validate } from "@shared";

const enrollmentRouter: RouterType = Router()

enrollmentRouter.post(
  "/enrollments",
  auth(["STUDENT", "INSTRUCTOR", "ADMIN"]),
  validate(validations.createEnrollmentSchema),
  enrollmentController.createEnrollment
)

enrollmentRouter.get(
  "/enrollments/me",
  auth(["STUDENT", "INSTRUCTOR", "ADMIN"]),
  validate(validations.getEnrollmentsQuerySchema),
  enrollmentController.getMyEnrollments
)

enrollmentRouter.get(
  "/enrollments/me/active",
  auth(["STUDENT", "INSTRUCTOR", "ADMIN"]),
  enrollmentController.getMyActiveEnrollments
);

enrollmentRouter.get(
  "/:courseId/enrollment/check",
  auth(["STUDENT", "INSTRUCTOR", "ADMIN"]),
  enrollmentController.checkEnrollment
)

enrollmentRouter.get(
  "/enrollments/:id",
  auth(["STUDENT", "INSTRUCTOR", "ADMIN"]),
  enrollmentController.getEnrollmentById
)

enrollmentRouter.put(
  "/enrollments/:id",
  auth(["STUDENT", "INSTRUCTOR", "ADMIN"]),
  validate(validations.updateEnrollmentSchema),
  enrollmentController.updateEnrollmentProgress
)

enrollmentRouter.delete(
  "/enrollments/:id",
  auth(["STUDENT", "INSTRUCTOR", "ADMIN"]),
  enrollmentController.dropEnrollment
)

enrollmentRouter.get(
  "/admin/enrollments",
  auth(["ADMIN"]),
  validate(validations.getEnrollmentsQuerySchema),
  enrollmentController.getAllEnrollments
)

export default enrollmentRouter;
