import { Router } from "express";
import type { Router as RouterType } from "express";
import * as userController from "../controllers/user.controller"
import { auth, cache, validate } from "@shared";
import { changePasswordSchema, getInstructorsQuerySchema, getUsersQuerySchema, updateInstructorProfileSchema, updateProfileSchema } from "../validations/user.validation";

const userRouter: RouterType = Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile endpoints
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
userRouter.get(
  "/me",
  auth(),
  cache({ prefix: "user:me", ttl: 60, varyByUser: true }),
  userController.getMe
)

userRouter.put(
  "/me/profile",
  auth(),
  validate(updateProfileSchema),
  userController.updateProfile
)

userRouter.put(
  "/me/instructor-profile",
  auth(['INSTRUCTOR']),
  validate(updateInstructorProfileSchema),
  userController.updateInstructorProfile
)

userRouter.put(
  "/me/password",
  auth(),
  validate(changePasswordSchema),
  userController.changePassword
)

userRouter.delete(
  "/me",
  auth(),
  userController.deleteAccount
)

// Admin endpoints
userRouter.get(
  "/",
  auth(["ADMIN"]),
  validate(getUsersQuerySchema),
  cache({ prefix: "users:list", ttl: 300 }),
  userController.getAllUsers
)

userRouter.get(
  "/instructors",
  auth(['ADMIN', 'INSTRUCTOR']),
  validate(getInstructorsQuerySchema),
  cache({ prefix: "users:instructors", ttl: 300 }),
  userController.getInstructors
)

userRouter.get(
  "/:id",
  auth(['ADMIN']),
  userController.getUserById
)

userRouter.put(
  "/:id/deactive",
  auth(['ADMIN']),
  userController.deactivateUser
)

userRouter.put(
  "/:id/reactivate",
  auth(['ADMIN']),
  userController.reactivateUser
)

userRouter.put(
  "/:id/verify",
  auth(['ADMIN']),
  userController.verifyUser
)

userRouter.put(
  "/:id/approve-instructor",
  auth(['ADMIN']),
  userController.approveInstructor
)

export default userRouter;
