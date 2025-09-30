import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config, commonComponents } from '@shared';
import type { Express } from 'express';

const apisGlobs = process.env.NODE_ENV === 'production'
  ? ['./dist/**/*.js']
  : ['./src/**/*.ts'];

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini-Udemy User Service',
      version: '1.0.0',
      description: 'Authentication and user profile endpoints',
    },
    servers: [
      { url: `http://localhost:${config.ports.userService}`, description: 'Local User Service' },
      { url: `http://localhost:${config.ports.gateway}`, description: 'Via Gateway' },
    ],
    components: {
      ...commonComponents,
      schemas: {
        // Request bodies
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 8, example: 'password123' },
            role: { type: 'string', enum: ['STUDENT','INSTRUCTOR','ADMIN'] },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          }
        },
        // Core entities
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            firstName: { type: 'string', nullable: true, example: 'John' },
            lastName: { type: 'string', nullable: true, example: 'Doe' },
            avatar: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
            phone: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            timezone: { type: 'string', nullable: true },
            language: { type: 'string', example: 'en' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          }
        },
        InstructorProfile: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 10 },
            userId: { type: 'integer', example: 1 },
            isApproved: { type: 'boolean', example: false },
            expertise: { type: 'array', items: { type: 'string' }, example: ['math','cs'] },
            experience: { type: 'string', nullable: true },
            education: { type: 'string', nullable: true },
            website: { type: 'string', nullable: true },
            linkedIn: { type: 'string', nullable: true },
            youtube: { type: 'string', nullable: true },
            rating: { type: 'number', nullable: true },
            studentCount: { type: 'integer', example: 0 },
            courseCount: { type: 'integer', example: 0 },
            totalEarnings: { type: 'number', example: 0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['STUDENT','INSTRUCTOR','ADMIN'], example: 'STUDENT' },
            isActive: { type: 'boolean', example: true },
            isVerified: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            profile: { $ref: '#/components/schemas/UserProfile' },
            instructorProfile: { $ref: '#/components/schemas/InstructorProfile' },
          }
        },
        // Response envelopes
        ApiResponseBase: commonComponents.schemas.ApiResponseBase,
        ErrorResponse: commonComponents.schemas.ErrorResponse,
        AuthData: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string' }
          },
          required: ['user','token']
        },
        TokenData: {
          type: 'object',
          properties: {
            token: { type: 'string' }
          },
          required: ['token']
        },
        UserData: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' }
          },
          required: ['user']
        },
        AuthResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponseBase' },
            {
              type: 'object',
              properties: { data: { $ref: '#/components/schemas/AuthData' } },
              required: ['data']
            }
          ]
        },
        TokenResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponseBase' },
            {
              type: 'object',
              properties: { data: { $ref: '#/components/schemas/TokenData' } },
              required: ['data']
            }
          ]
        },
        UserResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponseBase' },
            {
              type: 'object',
              properties: { data: { $ref: '#/components/schemas/UserData' } },
              required: ['data']
            }
          ]
        },
        EmptyResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponseBase' },
            {
              type: 'object',
              properties: { data: { nullable: true, default: null } }
            }
          ]
        }
      }
    },
    security: [{ cookieAuth: [] }, { bearerAuth: [] }]
  },
  apis: apisGlobs,
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Mini-Udemy User Service Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
      requestInterceptor: (req: any) => {
        req.credentials = 'include';
        return req;
      },
    },
  }));
  app.get('/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}

export default specs;
