import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 12);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password,
      role: Role.ADMIN,
      isVerified: true,
      profile: {
        create: { firstName: 'Admin', lastName: 'User' },
      },
    },
  });

  // Instructor
  await prisma.user.upsert({
    where: { email: 'instructor@example.com' },
    update: {},
    create: {
      email: 'instructor@example.com',
      password,
      role: Role.INSTRUCTOR,
      isVerified: true,
      profile: {
        create: { firstName: 'Ivy', lastName: 'Instructor' },
      },
      instructorProfile: {
        create: {
          isApproved: true,
          expertise: ['JavaScript', 'Node.js'],
          experience: '5 years teaching software development',
        },
      },
    },
  });

  // Student
  await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password,
      role: Role.STUDENT,
      isVerified: true,
      profile: {
        create: { firstName: 'Sam', lastName: 'Student' },
      },
    },
  });

  console.log('Database seeded with admin, instructor, and student.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

