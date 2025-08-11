import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Spotify Integration API')
    .setDescription('API for Spotify Integration - Top Artists and Tracks')
    .setVersion('1.0')
    .addTag('Auth', 'Authentication Endpoints')
    .addTag('Spotify', 'Spotify Integration Endpoints')
    .addTag('Health', 'Health Check Endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Token',
        name: 'Authorization',
        description: 'Enter Spotify Bearer token',
        in: 'header',
      },
      'spotify-bearer',
    )
    .addServer('http://127.0.0.1:3000', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Festify API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .topbar-wrapper .link {
        content: url('https://open.spotify.com/favicon.ico');
        width: 40px;
        height: 40px;
      }
      .swagger-ui .topbar {
         background-color: #1DB954;
       }
    `,
  });
}
