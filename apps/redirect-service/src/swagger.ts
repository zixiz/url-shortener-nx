import swaggerJSDoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URL Shortener - Redirect Service API',
      version: '1.0.0',
      description: 'API for redirecting short URLs to their original destination. This service is publicly accessible and handles the core redirection logic.',
    },
  },
  apis: ['./**/*routes.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express): void {
  // Serve Swagger UI at a different path to avoid conflicts if running locally
  app.use('/redirect-api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}