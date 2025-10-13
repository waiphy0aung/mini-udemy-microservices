import { mockPrisma } from '../../setup/mock.setup';
import * as sectionService from '../../../services/section.service';
import { mockSection } from '../../setup/fixtures';

describe('Section Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSection', () => {
    it('should create section and compute order when missing', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ instructorId: 1 } as any);
      mockPrisma.section.findFirst.mockResolvedValue(null as any);
      mockPrisma.section.aggregate.mockResolvedValue({ _max: { order: 2 } } as any);
      const expected = mockSection({ id: 1, order: 3 });
      mockPrisma.section.create.mockResolvedValue({ ...expected, lessons: [] } as any);

      const result = await sectionService.createSection(1, { courseId: 10, title: 'S1' });

      expect(mockPrisma.section.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ order: 3 }) })
      );
      expect(result.id).toBe(1);
    });

    it('should reject when not course owner', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ instructorId: 2 } as any);
      await expect(sectionService.createSection(1, { courseId: 10, title: 'S1' }))
        .rejects.toThrow('Not authorized');
    });

    it('should reject when course not found', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null as any);
      await expect(sectionService.createSection(1, { courseId: 10, title: 'S1' }))
        .rejects.toThrow('Course not found');
    });
  });

  describe('updateSection', () => {
    it('should update when owner', async () => {
      const section = { id: 1, course: { instructorId: 1 } } as any;
      mockPrisma.section.findUnique.mockResolvedValue(section);
      const updated = { ...section, title: 'Updated' } as any;
      mockPrisma.section.update.mockResolvedValue(updated);

      const result = await sectionService.updateSection(1, 1, { title: 'Updated' } as any);

      expect(mockPrisma.section.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { title: 'Updated' } })
      );
      expect(result.title).toBe('Updated');
    });

    it('should throw when not owner', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({ course: { instructorId: 2 } } as any);
      await expect(sectionService.updateSection(1, 1, { title: 'X' } as any)).rejects.toThrow('Not authorized');
    });

    it('should throw when section not found', async () => {
      mockPrisma.section.findUnique.mockResolvedValue(null as any);
      await expect(sectionService.updateSection(1, 1, { title: 'X' } as any)).rejects.toThrow('Section not found');
    });
  });

  describe('deleteSection', () => {
    it('should delete when owner', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({ id: 1, course: { instructorId: 1 } } as any);
      mockPrisma.section.delete.mockResolvedValue({ id: 1 } as any);
      await sectionService.deleteSection(1, 1);
      expect(mockPrisma.section.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('reorderSections', () => {
    it('should reorder when owner', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ instructorId: 1 } as any);
      mockPrisma.$transaction.mockResolvedValue([] as any);

      await sectionService.reorderSections(10, 1, [3, 2, 1]);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});

