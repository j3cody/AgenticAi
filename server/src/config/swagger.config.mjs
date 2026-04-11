import path from 'node:path';
import { fileURLToPath } from 'node:url';

import swaggerJsdoc from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 5000;
const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Agentic AI Mental Health Assistant API',
      version: '1.0.0',
      description:
        'REST API documentation for authentication, chat, user, and health endpoints.'
    },
    servers: [
      {
        url: baseUrl,
        description: 'Current environment'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Route not found'
            }
          }
        },
        SignupRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              example: 'Alex Johnson'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'alex@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'StrongPass123!'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'alex@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'StrongPass123!'
            }
          }
        },
        AuthSuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Authentication successful'
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '6612f2cb50f7dcf4f8e4b123'
                },
                name: {
                  type: 'string',
                  example: 'Alex Johnson'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'alex@example.com'
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'System',
        description: 'Operational endpoints'
      },
      {
        name: 'Auth',
        description: 'Authentication endpoints'
      }
    ]
  },
  apis: [
    path.resolve(__dirname, '../app.mjs'),
    path.resolve(__dirname, '../routes/*.js')
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
