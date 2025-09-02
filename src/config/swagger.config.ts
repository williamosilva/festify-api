import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Festify API')
    .setDescription(
      'The Festify API connects to Spotify to transform your listening history into unique festival lineups. ' +
        'Discover your top artists, customize visual styles, and generate immersive posters that celebrate your musical journey.',
    )
    .setVersion('1.0')
    .addTag('Auth', 'Authentication endpoints with Spotify')
    .addTag(
      'Spotify',
      'Integration with artists, tracks, and playlists from Spotify',
    )
    .addTag('Health', 'API health monitoring endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Token',
        name: 'Authorization',
        description: 'Enter your Spotify Bearer token',
        in: 'header',
      },
      'spotify-bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Festify API Documentation',
    customCss: `
    
      .swagger-ui .topbar {
         background-color: #1DB954;
       }
    `,
  });
}
