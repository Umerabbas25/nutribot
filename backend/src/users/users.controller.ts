import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { EmailService } from '../email/email.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/users/profile
  // ──────────────────────────────────────────────────────────────────────────
  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create user profile',
    description:
      'Called by the landing page form. Creates a profile, calculates TDEE and macro targets, sends a welcome email, then the user can start chatting on WhatsApp.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Profile created successfully. Daily nutrition targets calculated.',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Validation error — check request body' })
  @ApiResponse({ status: 409, description: 'Phone number already registered' })
  async createProfile(@Body() dto: CreateUserDto): Promise<{
    success: boolean;
    message: string;
    user: User;
    whatsappLink: string;
  }> {
    const user = await this.usersService.createProfile(dto);

    // Send welcome email (fire and forget — don't block the response)
    if (user.email) {
      this.emailService.sendWelcomeEmail(user).catch(() => {
        // Error already logged inside EmailService
      });
    }

    const whatsappNumber = process.env.WHATSAPP_PHONE_NUMBER || '1234567890';
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hi+NutriBot%2C+my+name+is+${encodeURIComponent(user.name)}`;

    return {
      success: true,
      message: `Profile created! Your daily target is ${user.dailyCalorieTarget} kcal.`,
      user,
      whatsappLink,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/users/:phone
  // ──────────────────────────────────────────────────────────────────────────
  @Get(':phone')
  @ApiOperation({
    summary: 'Get user profile by phone number',
    description: 'Look up a user profile using their WhatsApp phone number (digits only, no +).',
  })
  @ApiParam({
    name: 'phone',
    description: 'Phone number without + sign',
    example: '923001234567',
  })
  @ApiResponse({ status: 200, description: 'User profile', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getByPhone(@Param('phone') phone: string): Promise<User> {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new NotFoundException(`No user found with phone ${phone}`);
    }
    return user;
  }
}
