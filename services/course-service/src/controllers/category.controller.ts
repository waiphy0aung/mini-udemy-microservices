import type { Request, Response } from "express";
import * as categoryService from "../services/category.service";
import { ApiError, catchAsync } from "@shared";

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  return res.success({ category }, "Category created", 201);
});

export const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 50,
    search: req.query.search as string,
    parentId: req.query.parentId ? parseInt(req.query.parentId as string) : undefined
  }

  const result = await categoryService.getAllCategories(filters);
  return res.success(result, "Categories retrieved");
});

export const getRootCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await categoryService.getRootCategories();
  return res.success({ categories }, "Root Categories retrieved");
});

export const getCategory = catchAsync(async (req: Request, res: Response) => {
  const identifier = req.params.id;
  let category;

  if (/^\d+$/.test(identifier)) {
    category = await categoryService.getCategoryById(parseInt(identifier));
  } else {
    category = await categoryService.getCategoryBySlug(identifier);
  }

  if (!category) throw ApiError.notFound("Category not found");

  return res.success({ category }, "Category retrieved");
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const categoryId = parseInt(req.params.id);
  const category = await categoryService.updateCategory(categoryId, req.body);
  return res.success({ category }, "Category updated");
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const categoryId = parseInt(req.params.id);
  await categoryService.deleteCategory(categoryId);
  return res.success(null, "Category deleted");
});
