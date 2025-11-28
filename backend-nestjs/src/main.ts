import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Enable CORS
    app.enableCors({
      origin: true, // Reflects the request origin
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    // Enable validation
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false, // Allow extra properties from frontend
        transformOptions: {
          enableImplicitConversion: true, // Auto-convert string numbers to numbers
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
