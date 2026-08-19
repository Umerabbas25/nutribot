import { Controller, Post, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { WhatsappHandlerService } from '../whatsapp/whatsapp-handler.service';
import { IsString, IsNotEmpty } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ example: '923001234567', description: 'User phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'I ate a banana', description: 'The message text' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class ChatResponseDto {
  @ApiProperty({ example: 'Great! I logged 105 kcal for the banana.', description: 'AI reply' })
  reply: string;
}

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly usersService: UsersService,
    private readonly whatsappHandlerService: WhatsappHandlerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chat with NutriBot',
    description: 'Send a message to NutriBot directly from the web interface.',
  })
  @ApiBody({ type: ChatMessageDto })
  @ApiResponse({ status: 200, description: 'AI response', type: ChatResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendMessage(@Body() dto: ChatMessageDto): Promise<ChatResponseDto> {
    const user = await this.usersService.findByPhone(dto.phone);
    if (!user) {
      throw new NotFoundException('User not found. Please create a profile first.');
    }

    const reply = await this.whatsappHandlerService.processMessage(user, dto.message);
    return { reply };
  }
}
