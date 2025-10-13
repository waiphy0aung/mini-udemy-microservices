import { mockPrisma } from '../../setup/mock.setup';
import * as lessonService from '../../../services/lesson.service';

jest.mock('../../../services/course.service', () => ({
  calculateCourseDuration: jest.fn().mockResolvedValue(0),
}));

describe('Lesson Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLesson', () => {
    it('should create lesson and compute order when missing', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({ id: 5, course: { id: 10, instructorId: 1 } } as any);
      mockPrisma.lesson.findFirst.mockResolvedValue(null as any);
      mockPrisma.lesson.aggregate.mockResolvedValue({ _max: { order: 0 } } as any);
      mockPrisma.lesson.create.mockResolvedValue({ id: 1, order: 1 } as any);

      const res = await lessonService.createLesson(1, { sectionId: 5, title: 'L1', type: 'VIDEO' } as any);
      expect(res.id).toBe(1);
      expect(mockPrisma.lesson.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ order: 1 }) })
      );
    });

    it('should reject when not section owner', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({ course: { instructorId: 2 } } as any);
      await expect(lessonService.createLesson(1, { sectionId: 5, title: 'L1', type: 'VIDEO' } as any))
        .rejects.toThrow('Not authorized');
    });

    it('should reject when section not found', async () => {
      mockPrisma.section.findUnique.mockResolvedValue(null as any);
      await expect(lessonService.createLesson(1, { sectionId: 5, title: 'L1', type: 'VIDEO' } as any))
        .rejects.toThrow('Section not found');
    });
  });

  describe('updateLesson', () => {
    it('should update lesson when owner', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ id: 1, section: { course: { id: 10, instructorId: 1 } } } as any);
      mockPrisma.lesson.update.mockResolvedValue({ id: 1, title: 'Updated' } as any);
      const res = await lessonService.updateLesson(1, 1, { title: 'Updated' } as any);
      expect(res.title).toBe('Updated');
    });
  });

  describe('deleteLesson', () => {
    it('should delete lesson when owner', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ id: 1, section: { course: { id: 10, instructorId: 1 } } } as any);
      mockPrisma.lesson.delete.mockResolvedValue({ id: 1 } as any);
      await lessonService.deleteLesson(1, 1);
      expect(mockPrisma.lesson.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('reorderLessons', () => {
    it('should reorder when owner', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({ course: { instructorId: 1 } } as any);
      mockPrisma.$transaction.mockResolvedValue([] as any);
      await lessonService.reorderLessons(99, 1, [7, 8]);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});

