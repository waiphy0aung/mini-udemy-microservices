import { mockPrisma } from '../../setup/mock.setup';
import * as categoryService from '../../../services/category.service'
import { mockCategory, mockCourse } from '../../setup/fixtures';

describe('Category Service - Unit Tests', () => {
  describe('createCategory', () => {
    it('should create category with generated slug', async () => {
      const categoryData = {
        name: 'Web Development',
        description: 'Web dev courses',
      };

      const expectedCategory = mockCategory({
        name: 'Web Development',
        slug: 'web-development',
      });

      mockPrisma.category.findUnique.mockResolvedValue(null); // Slug available
      mockPrisma.category.create.mockResolvedValue(expectedCategory as any);

      const result = await categoryService.createCategory(categoryData);

      expect(mockPrisma.category.create).toHaveBeenCalled();
      expect(result.name).toBe('Web Development');
    });

    it('should validate parent exists', async () => {
      const categoryData = {
        name: 'Frontend',
        parentId: 1,
      };

      mockPrisma.category.findUnique
        .mockResolvedValueOnce(null) // Slug check
        .mockResolvedValueOnce(null); // Parent not found

      await expect(
        categoryService.createCategory(categoryData)
      ).rejects.toThrow('Parent category not found');
    });
  });

  describe('updateCategory', () => {
    it('should prevent self as parent', async () => {
      const category = mockCategory({ id: 1 });
      mockPrisma.category.findUnique.mockResolvedValue(category as any);

      await expect(
        categoryService.updateCategory(1, { parentId: 1 })
      ).rejects.toThrow('cannot be its own parent');
    });
  });

  describe('deleteCategory', () => {
    it('should prevent deleting category with children', async () => {
      const category = mockCategory({
        id: 1,
        children: [mockCategory({ id: 2 })],
      });

      mockPrisma.category.findUnique.mockResolvedValue(category as any);

      await expect(
        categoryService.deleteCategory(1)
      ).rejects.toThrow('with subcategories');
    });

    it('should prevent deleting category with courses', async () => {
      const category = mockCategory({
        id: 1,
        children: [],
        courses: [mockCourse({ id: 1 })],
      });

      mockPrisma.category.findUnique.mockResolvedValue(category as any);

      await expect(
        categoryService.deleteCategory(1)
      ).rejects.toThrow('with courses');
    });
  });
});
