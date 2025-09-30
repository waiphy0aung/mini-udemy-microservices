export const commonComponents = {
  securitySchemes: {
    bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' },
  },
  schemas: {
    ApiResponseBase: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        code: { type: 'integer', example: 200 },
        message: { type: 'string', example: 'OK' },
      },
      required: ['status', 'code', 'message']
    },
    ErrorResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        code: { type: 'integer', example: 500 },
        message: { type: 'string', example: 'Unexpected error' },
        stack: { type: 'string', nullable: true }
      },
      required: ['status', 'code', 'message']
    },
  }
} as const;

export type CommonComponents = typeof commonComponents;

