import prisma from '../src/db/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding course service database...');

  // Create Categories
  const webDev = await prisma.category.upsert({
    where: { slug: 'web-development' },
    update: {},
    create: {
      name: 'Web Development',
      slug: 'web-development',
      description: 'Build websites and web applications',
      icon: '🌐',
    },
  });

  const frontend = await prisma.category.upsert({
    where: { slug: 'frontend' },
    update: {},
    create: {
      name: 'Frontend',
      slug: 'frontend',
      description: 'User interface development',
      icon: '🎨',
      parentId: webDev.id,
    },
  });

  const backend = await prisma.category.upsert({
    where: { slug: 'backend' },
    update: {},
    create: {
      name: 'Backend',
      slug: 'backend',
      description: 'Server-side development',
      icon: '⚙️',
      parentId: webDev.id,
    },
  });

  const dataSci = await prisma.category.upsert({
    where: { slug: 'data-science' },
    update: {},
    create: {
      name: 'Data Science',
      slug: 'data-science',
      description: 'Data analysis and machine learning',
      icon: '📊',
    },
  });

  // Create Sample Courses
  // Assuming instructor with ID 2 exists from user service
  const instructorId = 2;

  const nodeCourse = await prisma.course.upsert({
    where: { slug: 'complete-nodejs-developer-course' },
    update: {},
    create: {
      title: 'Complete Node.js Developer Course',
      slug: 'complete-nodejs-developer-course',
      description: 'Learn Node.js by building real-world applications with Node, Express, MongoDB, and more!',
      thumbnail: 'https://example.com/nodejs-thumb.jpg',
      price: 49.99,
      currency: 'USD',
      instructorId,
      categoryId: backend.id,
      level: 'INTERMEDIATE',
      status: 'PUBLISHED',
      language: 'en',
      tags: ['nodejs', 'javascript', 'backend', 'express'],
      requirements: ['Basic JavaScript knowledge', 'Computer with internet access'],
      objectives: [
        'Build full-stack web applications',
        'Master Node.js and Express',
        'Work with MongoDB databases',
        'Deploy applications to production',
      ],
    },
  });

  const reactCourse = await prisma.course.upsert({
    where: { slug: 'react-complete-guide' },
    update: {},
    create: {
      title: 'React - The Complete Guide',
      slug: 'react-complete-guide',
      description: 'Dive in and learn React.js from scratch! Learn Reactjs, Hooks, Redux, React Routing, Animations, Next.js and way more!',
      thumbnail: 'https://example.com/react-thumb.jpg',
      price: 54.99,
      currency: 'USD',
      instructorId,
      categoryId: frontend.id,
      level: 'BEGINNER',
      status: 'PUBLISHED',
      language: 'en',
      tags: ['react', 'javascript', 'frontend', 'hooks'],
      requirements: ['Basic HTML, CSS, JavaScript'],
      objectives: [
        'Build powerful, fast, user-friendly and reactive web apps',
        'Apply for React developer jobs',
        'Learn React Hooks & Class-based Components',
        'Master Redux and React Router',
      ],
    },
  });

  const pythonCourse = await prisma.course.upsert({
    where: { slug: 'python-data-science-bootcamp' },
    update: {},
    create: {
      title: 'Python for Data Science Bootcamp',
      slug: 'python-data-science-bootcamp',
      description: 'Learn Python for data science, including NumPy, Pandas, Matplotlib, and Machine Learning!',
      price: 39.99,
      currency: 'USD',
      instructorId,
      categoryId: dataSci.id,
      level: 'BEGINNER',
      status: 'PUBLISHED',
      language: 'en',
      tags: ['python', 'data-science', 'pandas', 'numpy'],
      requirements: ['No prior programming experience needed'],
      objectives: [
        'Learn Python from scratch',
        'Master NumPy and Pandas',
        'Create data visualizations',
        'Build machine learning models',
      ],
    },
  });

  // Create Sections and Lessons for Node.js Course
  const nodeIntroSection = await prisma.section.create({
    data: {
      courseId: nodeCourse.id,
      title: 'Getting Started',
      description: 'Introduction to Node.js and setting up your environment',
      order: 0,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sectionId: nodeIntroSection.id,
        title: 'Welcome to the Course',
        description: 'Course overview and what you will learn',
        type: 'VIDEO',
        content: 'https://example.com/videos/node-welcome.mp4',
        duration: 300,
        order: 0,
        isFree: true,
      },
      {
        sectionId: nodeIntroSection.id,
        title: 'Installing Node.js',
        description: 'How to install Node.js on your system',
        type: 'VIDEO',
        content: 'https://example.com/videos/node-install.mp4',
        duration: 480,
        order: 1,
        isFree: true,
      },
      {
        sectionId: nodeIntroSection.id,
        title: 'Your First Node.js Script',
        description: 'Writing and running your first Node.js program',
        type: 'VIDEO',
        content: 'https://example.com/videos/node-first-script.mp4',
        duration: 600,
        order: 2,
        isFree: false,
      },
    ],
  });

  const nodeExpressSection = await prisma.section.create({
    data: {
      courseId: nodeCourse.id,
      title: 'Building Web Servers with Express',
      description: 'Learn how to build REST APIs with Express.js',
      order: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sectionId: nodeExpressSection.id,
        title: 'Introduction to Express',
        type: 'VIDEO',
        content: 'https://example.com/videos/express-intro.mp4',
        duration: 540,
        order: 0,
        isFree: false,
      },
      {
        sectionId: nodeExpressSection.id,
        title: 'Creating Routes',
        type: 'VIDEO',
        content: 'https://example.com/videos/express-routes.mp4',
        duration: 720,
        order: 1,
        isFree: false,
      },
      {
        sectionId: nodeExpressSection.id,
        title: 'Middleware Deep Dive',
        type: 'VIDEO',
        content: 'https://example.com/videos/express-middleware.mp4',
        duration: 900,
        order: 2,
        isFree: false,
      },
    ],
  });

  // Create Sections and Lessons for React Course
  const reactIntroSection = await prisma.section.create({
    data: {
      courseId: reactCourse.id,
      title: 'React Basics',
      description: 'Understanding React fundamentals',
      order: 0,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sectionId: reactIntroSection.id,
        title: 'What is React?',
        description: 'Introduction to React and why use it',
        type: 'VIDEO',
        content: 'https://example.com/videos/react-what.mp4',
        duration: 420,
        order: 0,
        isFree: true,
      },
      {
        sectionId: reactIntroSection.id,
        title: 'Setting Up Development Environment',
        type: 'VIDEO',
        content: 'https://example.com/videos/react-setup.mp4',
        duration: 600,
        order: 1,
        isFree: true,
      },
      {
        sectionId: reactIntroSection.id,
        title: 'JSX and Components',
        type: 'VIDEO',
        content: 'https://example.com/videos/react-jsx.mp4',
        duration: 780,
        order: 2,
        isFree: false,
      },
    ],
  });

  const reactHooksSection = await prisma.section.create({
    data: {
      courseId: reactCourse.id,
      title: 'React Hooks',
      description: 'Master useState, useEffect, and custom hooks',
      order: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sectionId: reactHooksSection.id,
        title: 'Introduction to Hooks',
        type: 'VIDEO',
        content: 'https://example.com/videos/react-hooks-intro.mp4',
        duration: 540,
        order: 0,
        isFree: false,
      },
      {
        sectionId: reactHooksSection.id,
        title: 'useState Hook',
        type: 'VIDEO',
        content: 'https://example.com/videos/react-usestate.mp4',
        duration: 720,
        order: 1,
        isFree: false,
      },
      {
        sectionId: reactHooksSection.id,
        title: 'useEffect Hook',
        type: 'VIDEO',
        content: 'https://example.com/videos/react-useeffect.mp4',
        duration: 840,
        order: 2,
        isFree: false,
      },
    ],
  });

  // Sample Enrollments (assuming users with IDs 1 and 3 exist)
  await prisma.enrollment.upsert({
    where: {
      userId_courseId: { userId: 1, courseId: nodeCourse.id },
    },
    update: {},
    create: {
      userId: 1,
      courseId: nodeCourse.id,
      status: 'ACTIVE',
      progress: 25.5,
      lastAccessedAt: new Date(),
    },
  });

  await prisma.enrollment.upsert({
    where: {
      userId_courseId: { userId: 1, courseId: reactCourse.id },
    },
    update: {},
    create: {
      userId: 1,
      courseId: reactCourse.id,
      status: 'ACTIVE',
      progress: 10.0,
      lastAccessedAt: new Date(),
    },
  });

  await prisma.enrollment.upsert({
    where: {
      userId_courseId: { userId: 3, courseId: reactCourse.id },
    },
    update: {},
    create: {
      userId: 3,
      courseId: reactCourse.id,
      status: 'ACTIVE',
      progress: 75.0,
      lastAccessedAt: new Date(),
    },
  });

  console.log('✅ Course service database seeded successfully!');
  console.log(`Created ${3} categories`);
  console.log(`Created ${3} courses`);
  console.log(`Created sections and lessons`);
  console.log(`Created sample enrollments`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
