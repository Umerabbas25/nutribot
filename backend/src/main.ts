// instrument.ts MUST be the very first import
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── Global Prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api', { exclude: ['whatsapp/webhook'] });

  // ─── Validation ────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ─── Swagger ───────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('NutriBot API')
    .setDescription(
      'AI-Powered Nutrition Chatbot — REST API for user profiles, nutrition logs, and admin operations.',
    )
    .setVersion('1.0')
    .addTag('users', 'User profile management')
    .addTag('nutrition', 'Food logs and nutrition data')
    .addTag('whatsapp', 'WhatsApp webhook endpoints')
    .addTag('email', 'Email operations')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'NutriBot API Docs',
    customCss: `
      .swagger-ui .topbar { background: linear-gradient(135deg, #0f766e, #065f46); }
      .swagger-ui .topbar-wrapper img { display: none; }
      .swagger-ui .topbar-wrapper::before { content: '🥗 NutriBot API'; color: white; font-size: 1.5rem; font-weight: bold; }
    `,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🥗 NutriBot is running on: http://localhost:${port}`);
  console.log(`📖 Swagger docs:           http://localhost:${port}/api/docs\n`);
}

bootstrap();
