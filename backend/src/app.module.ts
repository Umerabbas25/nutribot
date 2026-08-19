import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';

import { UsersModule } from './users/users.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { EmailModule } from './email/email.module';
import { ChatModule } from './chat/chat.module';
import { SentryGlobalFilter } from './common/sentry.filter';
import { User } from './users/user.entity';
import { FoodLog } from './nutrition/food-log.entity';

@Module({
  imports: [
    // ─── Config (loads .env) ────────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true }),

    // ─── Sentry ─────────────────────────────────────────────────────────────
    SentryModule.forRoot(),

    // ─── Database (PostgreSQL via Neon or local) ─────────────────────────────
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, FoodLog],
      synchronize: true, // Auto-creates/updates tables — disable in production
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.DATABASE_URL?.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false,
    }),

    // ─── Cron Jobs ──────────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── Feature Modules ────────────────────────────────────────────────────
    UsersModule,
    WhatsappModule,
    NutritionModule,
    EmailModule,
    ChatModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
