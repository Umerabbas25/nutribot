import {
  IsString,
  IsEmail,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'Full name', example: 'Ahmed Khan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'WhatsApp phone number without + sign (E.164 format)',
    example: '923001234567',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{7,15}$/, {
    message: 'Phone number must be 7-15 digits without + sign or spaces',
  })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Email address for weekly summaries', example: 'ahmed@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Age in years', example: 28, minimum: 10, maximum: 100 })
  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @Max(100)
  age: number;

  @ApiProperty({ description: 'Gender', enum: ['male', 'female', 'other'] })
  @IsEnum(['male', 'female', 'other'])
  gender: 'male' | 'female' | 'other';

  @ApiProperty({ description: 'Weight in kilograms', example: 75, minimum: 20, maximum: 300 })
  @IsNumber()
  @Type(() => Number)
  @Min(20)
  @Max(300)
  weightKg: number;

  @ApiProperty({ description: 'Height in centimetres', example: 175, minimum: 100, maximum: 250 })
  @IsNumber()
  @Type(() => Number)
  @Min(100)
  @Max(250)
  heightCm: number;

  @ApiProperty({
    description: 'Physical activity level',
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
    example: 'moderately_active',
  })
  @IsEnum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'])
  activityLevel: string;

  @ApiPropertyOptional({
    description: 'Medical conditions (comma-separated or "none")',
    example: 'diabetes, hypertension',
  })
  @IsString()
  @IsOptional()
  conditions?: string;

  @ApiPropertyOptional({
    description: 'Food allergies (comma-separated or "none")',
    example: 'peanuts, gluten',
  })
  @IsString()
  @IsOptional()
  allergies?: string;
}
