import request from 'supertest';
// Ensure DB is configured before importing the app
import { setupTestDatabase, teardownTestDatabase, clearDatabase, prisma } from '../../setup/database.setup';
import app from '../../../app';
import { generateAuthToken, createTestCourse, createTestCategory, createFullCourse } from '../../setup/fixtures';

describe('Course API - Integration Tests', () => {
  let instructorToken: string;
  let studentToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    instructorToken = generateAuthToken(1, 'INSTRUCTOR');
    studentToken = generateAuthToken(2, 'STUDENT');
    adminToken = generateAuthToken(3, 'ADMIN');
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /courses', () => {
    it('should create course as instructor', async () => {
      const response = await request(app)
        .post('/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'New Course',
          description: 'Course description',
          price: 49.99,
          level: 'BEGINNER',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.course.title).toBe('New Course');
      expect(response.body.data.course.slug).toBe('new-course');

      // Verify in database
      const course = await prisma.course.findUnique({
        where: { id: response.body.data.course.id },
      });
      expect(course).toBeDefined();
      expect(course?.title).toBe('New Course');
    });

    it('should reject invalid data', async () => {
      const response = await request(app)
        .post('/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'AB', // Too short
        });

      expect(response.status).toBe(400);
    });

    it('should reject student role', async () => {
      const response = await request(app)
        .post('/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Test Course' });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /courses', () => {
    it('should return published courses', async () => {
      await createTestCourse(prisma, 1, { status: 'PUBLISHED' });
      await createTestCourse(prisma, 1, { status: 'PUBLISHED' });
      await createTestCourse(prisma, 1, { status: 'DRAFT' }); // Should not appear

      const response = await request(app).get('/courses');

      expect(response.status).toBe(200);
      expect(response.body.data.courses).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter by category', async () => {
      const category = await createTestCategory(prisma);
      await createTestCourse(prisma, 1, { categoryId: category.id, status: 'PUBLISHED' });
      await createTestCourse(prisma, 1, { status: 'PUBLISHED' });

      const response = await request(app)
        .get('/courses')
        .query({ categoryId: category.id });

      expect(response.status).toBe(200);
      expect(response.body.data.courses).toHaveLength(1);
      expect(response.body.data.courses[0].categoryId).toBe(category.id);
    });

    it('should search courses', async () => {
      await createTestCourse(prisma, 1, { title: 'React Advanced', status: 'PUBLISHED' });
      await createTestCourse(prisma, 1, { title: 'Node.js Basics', status: 'PUBLISHED' });

      const response = await request(app)
        .get('/courses')
        .query({ search: 'react' });

      expect(response.status).toBe(200);
      expect(response.body.data.courses).toHaveLength(1);
      expect(response.body.data.courses[0].title).toContain('React');
    });
  });

  describe('PUT /courses/:id', () => {
    it('should update course as owner', async () => {
      const course = await createTestCourse(prisma, 1);

      const response = await request(app)
        .put(`/courses/${course.id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Updated Title',
          price: 99.99,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.course.title).toBe('Updated Title');
      expect(response.body.data.course.price).toBe(99.99);

      // Verify in database
      const updated = await prisma.course.findUnique({
        where: { id: course.id },
      });
      expect(updated?.title).toBe('Updated Title');
    });

    it('should reject non-owner', async () => {
      const course = await createTestCourse(prisma, 5); // Different instructor

      const response = await request(app)
        .put(`/courses/${course.id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ title: 'Hacked' });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /courses/:id/publish', () => {
    it('should publish course with content', async () => {
      const { course } = await createFullCourse(prisma, 1);

      const response = await request(app)
        .post(`/courses/${course.id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.course.status).toBe('PUBLISHED');

      // Verify in database
      const published = await prisma.course.findUnique({
        where: { id: course.id },
      });
      expect(published?.status).toBe('PUBLISHED');
    });

    it('should reject course without content', async () => {
      const course = await createTestCourse(prisma, 1);

      const response = await request(app)
        .post(`/courses/${course.id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('without content');
    });
  });

  describe('POST /courses/enrollments', () => {
    it('should enroll in published course', async () => {
      const course = await createTestCourse(prisma, 1, { status: 'PUBLISHED' });

      const response = await request(app)
        .post('/courses/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId: course.id });

      expect(response.status).toBe(201);
      expect(response.body.data.enrollment.courseId).toBe(course.id);
      expect(response.body.data.enrollment.userId).toBe(2);

      // Verify in database
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId: 2, courseId: course.id },
        },
      });
      expect(enrollment).toBeDefined();
      expect(enrollment?.status).toBe('ACTIVE');
    });

    it('should reject unpublished course', async () => {
      const course = await createTestCourse(prisma, 1, { status: 'DRAFT' });

      const response = await request(app)
        .post('/courses/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId: course.id });

      expect(response.status).toBe(400);
    });
  });

  describe('Categories', () => {
    describe('POST /courses/categories', () => {
      it('should create category as admin', async () => {
        const response = await request(app)
          .post('/courses/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Programming',
            description: 'Programming courses',
          });

        expect(response.status).toBe(201);
        expect(response.body.data.category.name).toBe('Programming');
        expect(response.body.data.category.slug).toBe('programming');

        // Verify in database
        const category = await prisma.category.findUnique({
          where: { slug: 'programming' },
        });
        expect(category).toBeDefined();
      });

      it('should reject non-admin', async () => {
        const response = await request(app)
          .post('/courses/categories')
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({ name: 'Test' });

        expect(response.status).toBe(403);
      });
    });

    describe('DELETE /courses/categories/:id', () => {
      it('should prevent deleting category with courses', async () => {
        const category = await createTestCategory(prisma);
        await createTestCourse(prisma, 1, { categoryId: category.id });

        const response = await request(app)
          .delete(`/courses/categories/${category.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('with courses');

        // Verify still in database
        const stillExists = await prisma.category.findUnique({
          where: { id: category.id },
        });
        expect(stillExists).toBeDefined();
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complete course lifecycle', async () => {
      // 1. Create course
      const createResponse = await request(app)
        .post('/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Complete Course',
          price: 49.99,
        });

      const courseId = createResponse.body.data.course.id;

      // 2. Add section
      const sectionResponse = await request(app)
        .post('/courses/sections')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          courseId,
          title: 'Section 1',
        });

      const sectionId = sectionResponse.body.data.section.id;

      // 3. Add lesson
      await request(app)
        .post('/courses/lessons')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          sectionId,
          title: 'Lesson 1',
          type: 'VIDEO',
        });

      // 4. Publish course
      const publishResponse = await request(app)
        .post(`/courses/${courseId}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(publishResponse.status).toBe(200);

      // 5. Student enrolls
      const enrollResponse = await request(app)
        .post('/courses/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId });

      expect(enrollResponse.status).toBe(201);

      // Verify complete flow in database
      const finalCourse = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          sections: {
            include: { lessons: true },
          },
          enrollments: true,
        },
      });

      expect(finalCourse?.status).toBe('PUBLISHED');
      expect(finalCourse?.sections).toHaveLength(1);
      expect(finalCourse?.sections[0].lessons).toHaveLength(1);
      expect(finalCourse?.enrollments).toHaveLength(1);
    });

    it('should handle cascading deletes', async () => {
      const { course, section, lesson } = await createFullCourse(prisma, 1);

      // Delete course
      await request(app)
        .delete(`/courses/${course.id}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      // Verify cascading delete
      const deletedCourse = await prisma.course.findUnique({
        where: { id: course.id },
      });
      const deletedSection = await prisma.section.findUnique({
        where: { id: section.id },
      });
      const deletedLesson = await prisma.lesson.findUnique({
        where: { id: lesson.id },
      });

      expect(deletedCourse).toBeNull();
      expect(deletedSection).toBeNull();
      expect(deletedLesson).toBeNull();
    });
  });
});
