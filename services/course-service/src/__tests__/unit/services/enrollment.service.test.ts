import { mockPrisma } from '../../setup/mock.setup';
import * as enrollmentService from '../../../services/enrollment.service';

describe('Enrollment Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEnrollment', () => {
    it('should create when course is published and not enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 1, status: 'PUBLISHED' } as any);
      mockPrisma.enrollment.findUnique.mockResolvedValue(null as any);
      mockPrisma.enrollment.create.mockResolvedValue({ id: 1, userId: 1, courseId: 1 } as any);

      const res = await enrollmentService.createEnrollment({ userId: 1, courseId: 1 });
      expect(res.id).toBe(1);
    });

    it('should reactivate dropped enrollment', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 1, status: 'PUBLISHED' } as any);
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 9, status: 'DROPPED', userId: 1, courseId: 1 } as any);
      mockPrisma.enrollment.update.mockResolvedValue({ id: 9, status: 'ACTIVE' } as any);

      const res = await enrollmentService.createEnrollment({ userId: 1, courseId: 1 });
      expect(res.status).toBe('ACTIVE');
    });

    it('should prevent duplicate active enrollment', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 1, status: 'PUBLISHED' } as any);
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 9, status: 'ACTIVE' } as any);
      await expect(enrollmentService.createEnrollment({ userId: 1, courseId: 1 }))
        .rejects.toThrow('Already enrolled');
    });

    it('should reject unpublished course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 1, status: 'DRAFT' } as any);
      await expect(enrollmentService.createEnrollment({ userId: 1, courseId: 1 }))
        .rejects.toThrow('unpublished');
    });

    it('should reject when course not found', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null as any);
      await expect(enrollmentService.createEnrollment({ userId: 1, courseId: 1 }))
        .rejects.toThrow('Course not found');
    });
  });

  describe('updateEnrollment', () => {
    it('should update progress and set completed when >= 100', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 1, userId: 1 } as any);
      mockPrisma.enrollment.update.mockResolvedValue({ id: 1, progress: 100, status: 'COMPLETED' } as any);
      const res = await enrollmentService.updateEnrollment(1, 1, { progress: 100 });
      expect(res.status).toBe('COMPLETED');
      expect(mockPrisma.enrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) })
      );
    });

    it('should forbid updating others enrollment', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 1, userId: 2 } as any);
      await expect(enrollmentService.updateEnrollment(1, 1, { progress: 10 }))
        .rejects.toThrow('Not authorized');
    });
  });

  describe('dropEnrollment', () => {
    it('should drop enrollment', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 1, userId: 1 } as any);
      mockPrisma.enrollment.update.mockResolvedValue({ id: 1 } as any);
      await enrollmentService.dropEnrollment(1, 1);
      expect(mockPrisma.enrollment.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: 'DROPPED' } });
    });
  });

  describe('helpers', () => {
    it('isUserEnrolled should return true for active enrollment', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue({ status: 'ACTIVE' } as any);
      await expect(enrollmentService.isUserEnrolled(1, 1)).resolves.toBe(true);
    });
  });
});
