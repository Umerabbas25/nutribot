import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailScheduler } from './email.scheduler';
import { UsersModule } from '../users/users.module';
import { NutritionModule } from '../nutrition/nutrition.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    NutritionModule,
  ],
  providers: [EmailService, EmailScheduler],
  exports: [EmailService],
})
export class EmailModule {}
