import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';

@Entity('food_logs')
export class FoodLog {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.foodLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  @ApiProperty({ description: 'Date of the log entry', example: '2024-08-10' })
  date: string;

  @Column('text')
  @ApiProperty({
    description: 'Raw meal description as sent by user',
    example: '2 rotis with dal and a glass of lassi',
  })
  mealDescription: string;

  @Column({ type: 'real', default: 0 })
  @ApiProperty({ description: 'Estimated calories in this meal', example: 450 })
  calories: number;

  @Column({ type: 'real', default: 0 })
  @ApiProperty({ description: 'Estimated protein (grams)', example: 18 })
  protein: number;

  @Column({ type: 'real', default: 0 })
  @ApiProperty({ description: 'Estimated carbohydrates (grams)', example: 65 })
  carbs: number;

  @Column({ type: 'real', default: 0 })
  @ApiProperty({ description: 'Estimated fat (grams)', example: 8 })
  fat: number;

  @Column({ type: 'text', nullable: true })
  aiSuggestion: string;

  @CreateDateColumn()
  createdAt: Date;
}
