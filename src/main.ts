import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Spotify Integration API')
    .setDescription('API for Spotify Integration - Top Artists and Tracks')
    .setVersion('1.0')
    .addTag('Auth', 'Authentication Endpoints')
    .addTag('Spotify', 'Spotify Integration Endpoints')
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

  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://127.0.0.1:${port}`);
}

bootstrap();
