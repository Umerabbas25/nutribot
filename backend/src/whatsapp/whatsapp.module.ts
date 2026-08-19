import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappHandlerService } from './whatsapp-handler.service';
import { UsersModule } from '../users/users.module';
import { NutritionModule } from '../nutrition/nutrition.module';

@Module({
  imports: [UsersModule, NutritionModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, WhatsappHandlerService],
  exports: [WhatsappHandlerService],
})
export class WhatsappModule {}
