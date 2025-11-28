import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Enable CORS
    app.enableCors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:8000',
        ];

        // Allow allowed origins and ANY Vercel deployment (frontend)
        if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
          callback(null, true);
        } else {
          console.log('Blocked CORS origin:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
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
