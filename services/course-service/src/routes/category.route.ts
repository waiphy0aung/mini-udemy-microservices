import { auth, cache, validate } from "@shared";
import { Router } from "express";
import type { Router as RouterType } from "express";
import * as categoryController from "../controllers/category.controller"
import * as validations from "../validations/category.validation"

const categoryRouter: RouterType = Router()

categoryRouter.get(
  "/categories",
  validate(validations.getCategoriesQuerySchema),
  cache({ prefix: "categories:list", ttl: 600 }),
  categoryController.getAllCategories
)

categoryRouter.get(
  "/categories/root",
  cache({ prefix: "categories:root", ttl: 600 }),
  categoryController.getRootCategories
)

categoryRouter.get(
  "/categories/:id",
  cache({ prefix: "categories:detail", ttl: 600 }),
  categoryController.getCategory
)

categoryRouter.post(
  "/categories",
  auth(["ADMIN"]),
  validate(validations.createCategorySchema),
  categoryController.createCategory
)

categoryRouter.put(
  "/categories/:id",
  auth(["ADMIN"]),
  validate(validations.updateCategorySchema),
  categoryController.updateCategory
)

categoryRouter.delete(
  "/categories/:id",
  auth(["ADMIN"]),
  categoryController.deleteCategory
)

export default categoryRouter;
