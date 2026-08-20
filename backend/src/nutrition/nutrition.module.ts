import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodLog } from './food-log.entity';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FoodLog]),
    forwardRef(() => EmailModule),
    forwardRef(() => UsersModule),
  ],
  providers: [NutritionService],
  controllers: [NutritionController],
  exports: [NutritionService],
})
export class NutritionModule {}
