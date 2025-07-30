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

  // Global validation pipe
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

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Spotify Integration API')
    .setDescription('API para integração com Spotify - Top Artists e Tracks')
    .setVersion('1.0')
    .addTag('Auth', 'Endpoints de autenticação')
    .addTag('Spotify', 'Endpoints de integração com Spotify')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Token',
        name: 'Authorization',
        description: 'Enter Spotify Bearer token',
        in: 'header',
      },
      'spotify-bearer', // Nome do esquema de segurança
    )
    .addServer('http://127.0.0.1:3001', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Customize Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Spotify API Documentation',
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

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  await app.listen(3001, '127.0.0.1');
  console.log(`🚀 Application is running on: http://127.0.0.1:3001`);
  console.log(`📚 Swagger documentation: http://127.0.0.1:3001/api/docs`);
  console.log(`❤️  Health check: http://127.0.0.1:3001/health`);
}

bootstrap();
