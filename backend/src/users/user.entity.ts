import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { FoodLog } from '../nutrition/food-log.entity';

export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

// Steps used for in-chat WhatsApp onboarding fallback
export type OnboardingStep =
  | 'complete'
  | 'awaiting_name'
  | 'awaiting_age'
  | 'awaiting_gender'
  | 'awaiting_weight'
  | 'awaiting_height'
  | 'awaiting_activity'
  | 'awaiting_conditions'
  | 'awaiting_allergies'
  | 'awaiting_email';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique user ID (UUID)' })
  id: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Full name', example: 'Ahmed Khan' })
  name: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'WhatsApp phone number (E.164 format)', example: '923001234567' })
  phoneNumber: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Email address for weekly summaries', example: 'ahmed@example.com' })
  email: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Age in years', example: 28 })
  age: number;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Gender', enum: ['male', 'female', 'other'] })
  gender: Gender;

  @Column({ type: 'real', nullable: true })
  @ApiProperty({ description: 'Weight in kilograms', example: 75 })
  weightKg: number;

  @Column({ type: 'real', nullable: true })
  @ApiProperty({ description: 'Height in centimetres', example: 175 })
  heightCm: number;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Activity level',
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
  })
  activityLevel: ActivityLevel;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Medical conditions (comma-separated)',
    example: 'diabetes, hypertension',
  })
  conditions: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Food allergies (comma-separated)', example: 'peanuts, gluten' })
  allergies: string;

  // ─── Calculated Targets ──────────────────────────────────────────────────
  @Column({ nullable: true })
  @ApiProperty({ description: 'Daily calorie target (kcal)', example: 2200 })
  dailyCalorieTarget: number;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Daily protein target (grams)', example: 132 })
  proteinGrams: number;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Daily carbohydrate target (grams)', example: 275 })
  carbsGrams: number;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Daily fat target (grams)', example: 61 })
  fatGrams: number;

  // ─── WhatsApp Onboarding State ───────────────────────────────────────────
  @Column({ default: 'complete' })
  onboardingStep: OnboardingStep;

  // ─── Timestamps ──────────────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ─── Relations ───────────────────────────────────────────────────────────
  @OneToMany(() => FoodLog, (log) => log.user)
  foodLogs: FoodLog[];
}
