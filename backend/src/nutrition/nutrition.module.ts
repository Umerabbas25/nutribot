import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodLog } from './food-log.entity';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FoodLog])],
  providers: [NutritionService],
  controllers: [NutritionController],
  exports: [NutritionService],
})
export class NutritionModule {}
