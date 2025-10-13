import type { Request, Response } from "express";
import * as categoryService from "../services/category.service";
import { ApiError, catchAsync, delByPrefix } from "@shared";

const clearCategoryCaches = async (categoryId?: number, categorySlug?: string) => {
  const tasks: Promise<any>[] = [];

  if (categoryId) tasks.push(delByPrefix(`categories:detail:/categories/${categoryId}`))
  if (categorySlug) tasks.push(delByPrefix(`categories:detail:/categories/${categorySlug}`))

  tasks.push(delByPrefix("categories:list"))
  tasks.push(delByPrefix("categories:root"))

  await Promise.allSettled(tasks)
}

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  await clearCategoryCaches()
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
  const { updated, oldSlug } = await categoryService.updateCategory(categoryId, req.body);
  await clearCategoryCaches(updated.id, oldSlug)
  return res.success({ category: updated }, "Category updated");
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const categoryId = parseInt(req.params.id);
  await categoryService.deleteCategory(categoryId);
  await clearCategoryCaches(categoryId)
  return res.success(null, "Category deleted");
});
