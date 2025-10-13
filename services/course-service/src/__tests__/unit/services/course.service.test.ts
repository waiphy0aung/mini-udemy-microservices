import * as courseService from '../../../services/course.service';
import { mockCourse } from '../../setup/fixtures';
import { mockPrisma } from '../../setup/mock.setup';

describe('Course Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createCourse', () => {
    it('should create course with valid data', async () => {
      const courseData = {
        title: 'Node.js Masterclass',
        description: 'Learn Node.js',
        price: 49.99,
        level: 'BEGINNER' as any,
      };

      const expectedCourse = mockCourse({
        title: 'Node.js Masterclass',
        slug: 'nodejs-masterclass',
      });

      mockPrisma.course.findUnique.mockResolvedValue(expectedCourse as any)

      mockPrisma.course.create.mockResolvedValue(expectedCourse);

      const result = await courseService.createCourse(1, courseData);

      expect(mockPrisma.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Node.js Masterclass',
          instructorId: 1,
          tags: [],
          requirements: [],
          objectives: [],
        }),
        include: expect.any(Object),
      });

      expect(result.title).toBe('Node.js Masterclass');
    });

    it('should set default values', async () => {
      const courseData = { title: 'Test Course' };
      const expectedCourse = mockCourse();

      mockPrisma.course.create.mockResolvedValue(expectedCourse);

      await courseService.createCourse(1, courseData);

      expect(mockPrisma.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tags: [],
          requirements: [],
          objectives: [],
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('getCourseById', () => {
    it('should return course when found', async () => {
      const course = mockCourse({ id: 1 });
      mockPrisma.course.findUnique.mockResolvedValue(course as any);

      const result = await courseService.getCourseById(1);

      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
      expect(result).toEqual(course);
    });

    it('should return null when not found', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      const result = await courseService.getCourseById(99999);

      expect(result).toBeNull();
    });
  });

  describe('updateCourse', () => {
    it('should update course when user is owner', async () => {
      const existingCourse = mockCourse({ id: 1, instructorId: 1 });
      const updatedCourse = mockCourse({ id: 1, title: 'Updated Title' });

      mockPrisma.course.findUnique.mockResolvedValue(existingCourse as any);
      mockPrisma.course.update.mockResolvedValue(updatedCourse as any);

      const { updated } = await courseService.updateCourse(1, 1, { title: 'Updated Title' });

      expect(mockPrisma.course.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ title: 'Updated Title' }),
        include: expect.any(Object),
      });
      expect(updated.title).toBe('Updated Title');
    });

    it('should throw error when course not found', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        courseService.updateCourse(999, 1, { title: 'Test' })
      ).rejects.toThrow('Course not found');
    });

    it('should throw error when user is not owner', async () => {
      const course = mockCourse({ id: 1, instructorId: 2 });
      mockPrisma.course.findUnique.mockResolvedValue(course as any);

      await expect(
        courseService.updateCourse(1, 1, { title: 'Hacked' })
      ).rejects.toThrow('Not authorized');
    });
  });

  describe('deleteCourse', () => {
    it('should delete course when user is owner', async () => {
      const course = mockCourse({ id: 1, instructorId: 1 });
      mockPrisma.course.findUnique.mockResolvedValue(course as any);
      mockPrisma.course.delete.mockResolvedValue(course as any);

      await courseService.deleteCourse(1, 1);

      expect(mockPrisma.course.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw error when not owner', async () => {
      const course = mockCourse({ id: 1, instructorId: 2 });
      mockPrisma.course.findUnique.mockResolvedValue(course as any);

      await expect(
        courseService.deleteCourse(1, 1)
      ).rejects.toThrow('Not authorized');

      expect(mockPrisma.course.delete).not.toHaveBeenCalled();
    });
  });

  describe('getAllCourses', () => {
    it('should return paginated courses', async () => {
      const courses = [mockCourse({ id: 1 }), mockCourse({ id: 2 })];

      mockPrisma.course.findMany.mockResolvedValue(courses as any);
      mockPrisma.course.count.mockResolvedValue(2);

      const result = await courseService.getAllCourses({ page: 1, limit: 10 });

      expect(result.courses).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
    });

    it('should filter by status', async () => {
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.course.count.mockResolvedValue(0);

      await courseService.getAllCourses({ status: 'PUBLISHED' as any });

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PUBLISHED' }),
        })
      );
    });

    it('should filter by category', async () => {
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.course.count.mockResolvedValue(0);

      await courseService.getAllCourses({ categoryId: 1 });

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 1 }),
        })
      );
    });
  });

  describe('publishCourse', () => {
    it('should publish course with content', async () => {
      const course = mockCourse({
        id: 1,
        instructorId: 1,
        sections: [
          {
            id: 1,
            lessons: [{ id: 1 }],
          },
        ],
      });

      const publishedCourse = mockCourse({ id: 1, status: 'PUBLISHED' as any });

      mockPrisma.course.findUnique.mockResolvedValue(course as any);
      mockPrisma.course.update.mockResolvedValue(publishedCourse as any);

      const result = await courseService.publishCourse(1, 1);

      expect(result.status).toBe('PUBLISHED');
      expect(mockPrisma.course.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'PUBLISHED' },
        include: expect.any(Object),
      });
    });

    it('should throw error when no content', async () => {
      const course = mockCourse({
        id: 1,
        instructorId: 1,
        sections: [], // No sections
      });

      mockPrisma.course.findUnique.mockResolvedValue(course as any);

      await expect(
        courseService.publishCourse(1, 1)
      ).rejects.toThrow('Cannot publish course without content');
    });
  });
});
