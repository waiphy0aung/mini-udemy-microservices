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
      title: 'Mini-Udemy API Gateway',
      version: '1.0.0',
      description: 'API Gateway documentation and health endpoints',
    },
    servers: [
      {
        url: `http://localhost:${config.ports.gateway}`,
        description: 'Local Gateway',
      },
    ],
    components: {
      ...commonComponents,
      schemas: {
        ApiResponseBase: commonComponents.schemas.ApiResponseBase,
        ErrorResponse: commonComponents.schemas.ErrorResponse,
        HealthData: {
          type: 'object',
          properties: {
            uptime: { type: 'number', example: 123.45 }
          },
          required: ['uptime']
        },
        HealthResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponseBase' },
            {
              type: 'object',
              properties: { data: { $ref: '#/components/schemas/HealthData' } },
              required: ['data']
            }
          ]
        },
        ServiceHealthItem: {
          type: 'object',
          properties: {
            service: { type: 'string', example: '/api/users' },
            url: { type: 'string', example: 'http://localhost:3001' },
            status: { type: 'string', example: 'healthy' },
            statusCode: { type: 'integer', example: 200, nullable: true },
            error: { type: 'string', nullable: true }
          }
        },
        ServicesHealthData: {
          type: 'object',
          properties: {
            services: { type: 'array', items: { $ref: '#/components/schemas/ServiceHealthItem' } }
          },
          required: ['services']
        },
        ServicesHealthResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponseBase' },
            {
              type: 'object',
              properties: { data: { $ref: '#/components/schemas/ServicesHealthData' } },
              required: ['data']
            }
          ]
        }
      }
    },
  },
  apis: apisGlobs,
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Mini-Udemy Gateway Docs',
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
