import { setupTestDatabase, teardownTestDatabase, clearDatabase, prisma } from '../../setup/database.setup';
import { createTestCourse, createTestCategory, createTestSection, createTestLesson } from '../../setup/fixtures';

describe('Database Queries - Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Complex Queries', () => {
    it('should query courses with nested relations', async () => {
      const category = await createTestCategory(prisma);
      const course = await createTestCourse(prisma, 1, { categoryId: category.id });
      const section = await createTestSection(prisma, course.id);
      await createTestLesson(prisma, section.id);

      const result = await prisma.course.findUnique({
        where: { id: course.id },
        include: {
          category: true,
          sections: {
            include: {
              lessons: true,
            },
          },
        },
      });

      expect(result).toBeDefined();
      expect(result?.category).toBeDefined();
      expect(result?.sections).toHaveLength(1);
      expect(result?.sections[0].lessons).toHaveLength(1);
    });

    it('should handle unique constraint violations', async () => {
      const category = await createTestCategory(prisma, { slug: 'unique-slug' });

      await expect(
        createTestCategory(prisma, { slug: 'unique-slug' })
      ).rejects.toThrow();
    });

    it('should perform aggregations', async () => {
      await createTestCourse(prisma, 1, { price: 10 });
      await createTestCourse(prisma, 1, { price: 20 });
      await createTestCourse(prisma, 1, { price: 30 });

      const result = await prisma.course.aggregate({
        _avg: { price: true },
        _max: { price: true },
        _min: { price: true },
        _sum: { price: true },
      });

      expect(result._avg.price).toBe(20);
      expect(result._max.price).toBe(30);
      expect(result._min.price).toBe(10);
      expect(result._sum.price).toBe(60);
    });

    it('should handle transactions', async () => {
      const category = await createTestCategory(prisma);

      await prisma.$transaction(async (tx) => {
        const course1 = await tx.course.create({
          data: {
            title: 'Course 1',
            slug: 'course-1',
            instructorId: 1,
            categoryId: category.id,
          },
        });

        const course2 = await tx.course.create({
          data: {
            title: 'Course 2',
            slug: 'course-2',
            instructorId: 1,
            categoryId: category.id,
          },
        });

        expect(course1).toBeDefined();
        expect(course2).toBeDefined();
      });

      const courses = await prisma.course.findMany();
      expect(courses).toHaveLength(2);
    });

    it('should rollback failed transactions', async () => {
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.course.create({
            data: {
              title: 'Course 1',
              slug: 'course-1',
              instructorId: 1,
            },
          });

          // This will fail (duplicate slug)
          await tx.course.create({
            data: {
              title: 'Course 2',
              slug: 'course-1', // Duplicate!
              instructorId: 1,
            },
          });
        })
      ).rejects.toThrow();

      // Verify rollback
      const courses = await prisma.course.findMany();
      expect(courses).toHaveLength(0);
    });
  });

  describe('Performance Tests', () => {
    it('should efficiently query with indexes', async () => {
      // Create test data
      for (let i = 0; i < 50; i++) {
        await createTestCourse(prisma, 1, { status: 'PUBLISHED' });
      }

      const start = Date.now();
      
      // Query should use index on status
      const courses = await prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        take: 10,
      });

      const duration = Date.now() - start;

      expect(courses).toHaveLength(10);
      expect(duration).toBeLessThan(100); // Should be fast with index
    });

    it('should handle pagination efficiently', async () => {
      // Create 100 courses
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          createTestCourse(prisma, 1, { 
            title: `Course ${i}`,
            slug: `course-${i}`,
          })
        );
      }
      await Promise.all(promises);

      // Page through results
      const page1 = await prisma.course.findMany({
        take: 20,
        skip: 0,
        orderBy: { id: 'asc' },
      });

      const page2 = await prisma.course.findMany({
        take: 20,
        skip: 20,
        orderBy: { id: 'asc' },
      });

      expect(page1).toHaveLength(20);
      expect(page2).toHaveLength(20);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });
});
