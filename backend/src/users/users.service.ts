import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, OnboardingStep } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import {
  calculateTDEE,
  ActivityLevel,
  Gender,
} from '../common/tdee.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Create a new user profile from the landing page form.
   * Calculates TDEE and macro targets immediately.
   */
  async createProfile(dto: CreateUserDto): Promise<User> {
    // Calculate nutrition targets
    const targets = calculateTDEE(
      dto.weightKg,
      dto.heightCm,
      dto.age,
      dto.gender as Gender,
      dto.activityLevel as ActivityLevel,
    );

    // Check for existing phone number
    let user = await this.userRepo.findOne({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (user) {
      // Update existing user instead of throwing conflict
      user = Object.assign(user, {
        name: dto.name,
        email: dto.email,
        age: dto.age,
        gender: dto.gender as Gender,
        weightKg: dto.weightKg,
        heightCm: dto.heightCm,
        activityLevel: dto.activityLevel as ActivityLevel,
        conditions: dto.conditions,
        allergies: dto.allergies,
        dailyCalorieTarget: targets.tdee,
        proteinGrams: targets.proteinGrams,
        carbsGrams: targets.carbsGrams,
        fatGrams: targets.fatGrams,
        onboardingStep: 'complete',
      });
    } else {
      user = this.userRepo.create({
        name: dto.name,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        age: dto.age,
        gender: dto.gender as Gender,
        weightKg: dto.weightKg,
        heightCm: dto.heightCm,
        activityLevel: dto.activityLevel as ActivityLevel,
        conditions: dto.conditions,
        allergies: dto.allergies,
        dailyCalorieTarget: targets.tdee,
        proteinGrams: targets.proteinGrams,
        carbsGrams: targets.carbsGrams,
        fatGrams: targets.fatGrams,
        onboardingStep: 'complete',
      });
    }

    return this.userRepo.save(user) as Promise<User>;
  }

  /**
   * Find a user by their WhatsApp phone number.
   */
  async findByPhone(phoneNumber: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { phoneNumber } });
  }

  /**
   * Find a user by ID.
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  /**
   * Get all users (for weekly email cron).
   */
  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  /**
   * Update any field on a user record (used by WhatsApp onboarding).
   */
  async update(id: string, updates: Partial<User>): Promise<User> {
    await this.userRepo.update(id, updates);
    return this.findById(id);
  }

  /**
   * Update the onboarding step for a user.
   */
  async setOnboardingStep(userId: string, step: OnboardingStep): Promise<void> {
    await this.userRepo.update(userId, { onboardingStep: step });
  }

  /**
   * Recalculate targets after profile update.
   */
  async recalculateTargets(user: User): Promise<User> {
    if (!user.weightKg || !user.heightCm || !user.age || !user.gender || !user.activityLevel) {
      return user; // Can't calculate yet
    }
    const targets = calculateTDEE(
      user.weightKg,
      user.heightCm,
      user.age,
      user.gender as Gender,
      user.activityLevel as ActivityLevel,
    );
    return this.update(user.id, {
      dailyCalorieTarget: targets.tdee,
      proteinGrams: targets.proteinGrams,
      carbsGrams: targets.carbsGrams,
      fatGrams: targets.fatGrams,
    });
  }

  /**
   * Find or create a minimal user record from WhatsApp
   * (for users who skip the website — fallback onboarding).
   */
  async findOrCreateFromWhatsApp(phoneNumber: string): Promise<User> {
    let user = await this.findByPhone(phoneNumber);
    if (!user) {
      user = this.userRepo.create({
        phoneNumber,
        onboardingStep: 'awaiting_name',
      });
      user = await this.userRepo.save(user);
    }
    return user;
  }
}
