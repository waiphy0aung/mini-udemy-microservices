import ApiError from "@shared/utils/ApiError";
import { generateSlug } from "@shared/utils/slug";
import prisma from "../db/client";
import { Category } from "@prisma/client"
import { CategoryFilters, CategoryWithRelations, CreateCategoryRequest, UpdateCategoryRequest } from "../types";

const ensureUniqueSlug = async (baseSlug: string, excluded?: number): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!existing || existing.id === excluded) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

const checkIsDescendant = async (
  ancestorId: number,
  descendantId: number
): Promise<boolean> => {
  let currentId: number | null = descendantId;

  while (currentId !== null) {
    if (currentId === ancestorId) return true;

    const category: Category = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    })

    if (!category) break;
    currentId = category.parentId;
  }

  return false
}

export const createCategory = async (data: CreateCategoryRequest): Promise<CategoryWithRelations> => {
  const baseSlug = generateSlug(data.name);
  const slug = await ensureUniqueSlug(baseSlug);

  if (data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId }
    });
    if (!parent) throw ApiError.notFound("Parent category not found")
  }

  const category = await prisma.category.create({
    data: {
      ...data,
      slug
    },
    include: {
      parent: true,
      children: true
    }
  })

  return category
}

export const getCategoryById = async (id: number): Promise<CategoryWithRelations | null> => {
  return await prisma.category.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true,
      courses: {
        where: { status: "PUBLISHED" },
        take: 10
      }
    }
  })
}

export const getCategoryBySlug = async (slug: string): Promise<CategoryWithRelations | null> => {
  return await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: true,
      courses: {
        where: { status: "PUBLISHED" },
        take: 10
      }
    }
  })
}

export const getAllCategories = async (filters: CategoryFilters) => {
  const { page = 1, limit = 50, search, parentId } = filters;
  const skip = (page - 1) * limit;

  const where: any = {}

  if (parentId !== undefined) {
    where.parentId = parentId
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { courses: true }
        }
      },
      skip,
      take: limit,
      orderBy: { name: "asc" }
    }),
    prisma.category.count({ where })
  ])

  return {
    categories,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

export const updateCategory = async (id: number, data: UpdateCategoryRequest): Promise<{ updated: CategoryWithRelations, oldSlug: string }> => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound("Category not found");
  const oldSlug = category.slug

  if (data.parentId) {
    if (data.parentId === id) {
      throw ApiError.badRequest("Category cannot be its own parent")
    }

    const isDescendant = await checkIsDescendant(id, data.parentId);
    if (isDescendant) {
      throw ApiError.badRequest("Cannot set a descendant as parent")
    }
  }

  const updateData: any = { ...data }

  if (data.name && data.name !== category.name) {
    const baseSlug = generateSlug(data.name);
    updateData.slug = await ensureUniqueSlug(baseSlug, id);
  }

  const updated = await prisma.category.update({
    where: { id },
    data: updateData,
    include: {
      parent: true,
      children: true
    }
  })

  return { updated, oldSlug }
}

export const deleteCategory = async (id: number): Promise<void> => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      children: true,
      courses: true
    }
  })

  if (!category) throw ApiError.notFound("Category not found");

  if (category.children.length > 0) {
    throw ApiError.badRequest("Cannot delete category with subcategories");
  }

  if (category.courses.length > 0) {
    throw ApiError.badRequest("Cannot delete category with courses")
  }

  await prisma.category.delete({ where: { id } })
}

export const getRootCategories = async () => {
  return await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: true,
      _count: {
        select: { courses: true }
      }
    },
    orderBy: { name: "asc" }
  })
}
