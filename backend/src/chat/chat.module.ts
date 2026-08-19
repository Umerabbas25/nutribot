import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { UsersModule } from '../users/users.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [UsersModule, WhatsappModule],
  controllers: [ChatController],
})
export class ChatModule {}
