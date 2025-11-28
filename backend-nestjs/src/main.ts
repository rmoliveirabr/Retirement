import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    const frontendOrigin = process.env.CORS_ORIGIN || 'https://retirement-frontend-git-main-rodrigo-machado-oliveiras-projects.vercel.app';

    // Enable CORS
    app.enableCors({
      origin: frontendOrigin,
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    // Enable validation
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    const port = process.env.PORT || 8000;
    await app.listen(port);
    console.log(`🚀 Retirement Planning API running on http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api`);
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
