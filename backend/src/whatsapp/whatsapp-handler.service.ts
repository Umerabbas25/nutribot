import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { WhatsappService } from './whatsapp.service';
import { User, OnboardingStep } from '../users/user.entity';
import { calculateTDEE, formatMacroSummary, ActivityLevel, Gender } from '../common/tdee.util';

// Keywords that indicate the user wants to see their today's summary
const SUMMARY_KEYWORDS = ['summary', 'today', 'progress', 'status', 'how am i', 'report'];

// Keywords that indicate help
const HELP_KEYWORDS = ['help', 'menu', 'commands', 'what can you do'];

// Keywords that trigger a "log a meal" context
const LOG_KEYWORDS = ['ate', 'had', 'eaten', 'breakfast', 'lunch', 'dinner', 'snack', 'drank', 'drink'];

@Injectable()
export class WhatsappHandlerService {
  private readonly logger = new Logger(WhatsappHandlerService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly nutritionService: NutritionService,
    private readonly whatsappService: WhatsappService,
  ) {}

  /**
   * Main dispatcher — called for every incoming WhatsApp message.
   */
  async handleMessage(from: string, text: string): Promise<void> {
    this.logger.log(`Incoming from ${from}: ${text}`);

    // Find or create the user
    const user = await this.usersService.findOrCreateFromWhatsApp(from);

    // If it's a meal log, send a loading message first (WhatsApp only UX)
    const lower = text.toLowerCase();
    const isMealLog = user.onboardingStep === 'complete' && 
      !HELP_KEYWORDS.some((k) => lower.includes(k)) && 
      !SUMMARY_KEYWORDS.some((k) => lower.includes(k)) &&
      !(lower === 'profile' || lower === 'my profile');
      
    if (isMealLog) {
      await this.whatsappService.sendMessage(from, '⏳ Analysing your meal...');
    }

    try {
      const responseText = await this.processMessage(user, text);
      await this.whatsappService.sendMessage(from, responseText);
    } catch (error) {
      this.logger.error('Error processing message', error);
      await this.whatsappService.sendMessage(
        from,
        '❌ I had trouble processing that. Could you try again?',
      );
    }
  }

  /**
   * Core logic for processing a message. Returns the response string.
   * Can be used by Web Chat or WhatsApp.
   */
  async processMessage(user: User, text: string): Promise<string> {
    if (user.onboardingStep !== 'complete') {
      return this.handleOnboarding(user, text);
    }

    const lower = text.toLowerCase();

    if (HELP_KEYWORDS.some((k) => lower.includes(k))) {
      return this.getHelpMenu(user.name);
    }

    if (SUMMARY_KEYWORDS.some((k) => lower.includes(k))) {
      return this.getDailySummary(user);
    }

    if (lower === 'profile' || lower === 'my profile') {
      return this.getProfile(user);
    }

    // Default: treat the message as a meal log
    return this.handleMealLog(user, text);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // MEAL LOGGING
  // ────────────────────────────────────────────────────────────────────────────

  private async handleMealLog(user: User, text: string): Promise<string> {
    const { suggestion } = await this.nutritionService.logMealAndGetSuggestion(user, text);
    return suggestion;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // DAILY SUMMARY
  // ────────────────────────────────────────────────────────────────────────────

  private async getDailySummary(user: User): Promise<string> {
    const { calories, protein, carbs, fat, logs } =
      await this.nutritionService.getTodayTotals(user.id);

    const calPercent = Math.round((calories / user.dailyCalorieTarget) * 100);

    const bar = this.progressBar(calPercent);

    let message =
      `📊 *Today's Progress for ${user.name || 'you'}*\n\n` +
      `${bar} ${calPercent}%\n` +
      `🔥 Calories: *${calories}* / ${user.dailyCalorieTarget} kcal\n` +
      `🥩 Protein: *${protein}g* / ${user.proteinGrams}g\n` +
      `🍞 Carbs: *${carbs}g* / ${user.carbsGrams}g\n` +
      `🧈 Fat: *${fat}g* / ${user.fatGrams}g\n\n`;

    if (logs.length === 0) {
      message += `You haven't logged any meals today. Send me what you've eaten! 🍽️`;
    } else {
      message += `*Meals logged today (${logs.length}):*\n`;
      logs.forEach((log, i) => {
        message += `${i + 1}. ${log.mealDescription} (~${log.calories} kcal)\n`;
      });
    }

    return message;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PROFILE VIEW
  // ────────────────────────────────────────────────────────────────────────────

  private async getProfile(user: User): Promise<string> {
    return (
      `👤 *Your NutriBot Profile*\n\n` +
      `• Name: ${user.name || '—'}\n` +
      `• Age: ${user.age || '—'}\n` +
      `• Gender: ${user.gender || '—'}\n` +
      `• Weight: ${user.weightKg ? user.weightKg + ' kg' : '—'}\n` +
      `• Height: ${user.heightCm ? user.heightCm + ' cm' : '—'}\n` +
      `• Activity: ${user.activityLevel?.replace(/_/g, ' ') || '—'}\n` +
      `• Conditions: ${user.conditions || 'None'}\n` +
      `• Allergies: ${user.allergies || 'None'}\n\n` +
      `🎯 *Daily Targets*\n` +
      `• Calories: ${user.dailyCalorieTarget || '—'} kcal\n` +
      `• Protein: ${user.proteinGrams || '—'}g\n` +
      `• Carbs: ${user.carbsGrams || '—'}g\n` +
      `• Fat: ${user.fatGrams || '—'}g`
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // HELP MENU
  // ────────────────────────────────────────────────────────────────────────────

  private getHelpMenu(name?: string): string {
    const greeting = name ? `Hi ${name}! 👋` : 'Hi! 👋';
    return (
      `${greeting} I'm *NutriBot*, your AI dietician.\n\n` +
      `Here's what you can do:\n\n` +
      `🍽️ *Log a meal* — just tell me what you ate\n` +
      `   _e.g. "I had 2 chapatis with chicken curry"\n` +
      `   or "breakfast was eggs and toast"_\n\n` +
      `📊 *today* — see your nutrition summary for today\n\n` +
      `👤 *profile* — view your profile and targets\n\n` +
      `💬 *help* — show this menu\n\n` +
      `_Tip: Just describe your meal naturally — I'll figure out the nutrition!_ 🥗`
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // IN-CHAT ONBOARDING (fallback for users who skip the website)
  // ────────────────────────────────────────────────────────────────────────────

  private async handleOnboarding(user: User, text: string): Promise<string> {
    switch (user.onboardingStep) {
      case 'awaiting_name':
        await this.usersService.update(user.id, { name: text });
        await this.usersService.setOnboardingStep(user.id, 'awaiting_age');
        return `Nice to meet you, *${text}*! 🎉\n\nHow old are you? (Enter your age in years)`;

      case 'awaiting_age': {
        const age = parseInt(text);
        if (isNaN(age) || age < 10 || age > 100) {
          return 'Please enter a valid age between 10 and 100.';
        }
        await this.usersService.update(user.id, { age });
        await this.usersService.setOnboardingStep(user.id, 'awaiting_gender');
        return `What is your gender?\nReply: *male*, *female*, or *other*`;
      }

      case 'awaiting_gender': {
        const gender = text.toLowerCase();
        if (!['male', 'female', 'other'].includes(gender)) {
          return 'Please reply with *male*, *female*, or *other*.';
        }
        await this.usersService.update(user.id, { gender: gender as Gender });
        await this.usersService.setOnboardingStep(user.id, 'awaiting_weight');
        return `What is your current weight?\n(Enter in kilograms, e.g. *72*)`;
      }

      case 'awaiting_weight': {
        const weight = parseFloat(text);
        if (isNaN(weight) || weight < 20 || weight > 300) {
          return 'Please enter your weight in kg (e.g. 72).';
        }
        await this.usersService.update(user.id, { weightKg: weight });
        await this.usersService.setOnboardingStep(user.id, 'awaiting_height');
        return `What is your height?\n(Enter in centimetres, e.g. *175*)`;
      }

      case 'awaiting_height': {
        const height = parseFloat(text);
        if (isNaN(height) || height < 100 || height > 250) {
          return 'Please enter your height in cm (e.g. 175).';
        }
        await this.usersService.update(user.id, { heightCm: height });
        await this.usersService.setOnboardingStep(user.id, 'awaiting_activity');
        return `What is your activity level? Reply with a number:\n\n` +
            `1️⃣ Sedentary (desk job, little exercise)\n` +
            `2️⃣ Lightly active (1-3 days/week)\n` +
            `3️⃣ Moderately active (3-5 days/week)\n` +
            `4️⃣ Very active (6-7 days/week)\n` +
            `5️⃣ Extra active (physical job + training)`;
      }

      case 'awaiting_activity': {
        const activityMap: Record<string, ActivityLevel> = {
          '1': 'sedentary',
          '2': 'lightly_active',
          '3': 'moderately_active',
          '4': 'very_active',
          '5': 'extra_active',
          sedentary: 'sedentary',
          lightly: 'lightly_active',
          moderately: 'moderately_active',
          very: 'very_active',
          extra: 'extra_active',
        };
        const activity = activityMap[text.toLowerCase().split(' ')[0]];
        if (!activity) {
          return 'Please reply with a number from 1 to 5.';
        }
        await this.usersService.update(user.id, { activityLevel: activity });
        await this.usersService.setOnboardingStep(user.id, 'awaiting_conditions');
        return `Do you have any medical conditions I should know about?\n(e.g. *diabetes, hypertension*)\nOr type *none* if not applicable.`;
      }

      case 'awaiting_conditions':
        await this.usersService.update(user.id, {
          conditions: text.toLowerCase() === 'none' ? null : text,
        });
        await this.usersService.setOnboardingStep(user.id, 'awaiting_allergies');
        return `Any food allergies?\n(e.g. *peanuts, gluten, dairy*)\nOr type *none*.`;

      case 'awaiting_allergies': {
        await this.usersService.update(user.id, {
          allergies: text.toLowerCase() === 'none' ? null : text,
        });
        await this.usersService.setOnboardingStep(user.id, 'awaiting_email');
        return `Lastly, what's your email address? I'll send you a weekly nutrition summary.\nOr type *skip* to skip this step.`;
      }

      case 'awaiting_email': {
        const email = text.toLowerCase() === 'skip' ? null : text;
        const updatedUser = await this.usersService.update(user.id, {
          email,
          onboardingStep: 'complete',
        });

        // Calculate targets now that we have all data
        const withTargets = await this.usersService.recalculateTargets(updatedUser);

        const summary = formatMacroSummary({
          bmr: 0,
          tdee: withTargets.dailyCalorieTarget,
          proteinGrams: withTargets.proteinGrams,
          carbsGrams: withTargets.carbsGrams,
          fatGrams: withTargets.fatGrams,
        });

        return `🎉 *Your profile is complete, ${withTargets.name || 'friend'}!*\n\n` +
            `${summary}\n\n` +
            `Now just tell me what you eat and I'll track it for you. ` +
            `Type *help* to see all commands. Let's do this! 💪`;
      }

      default:
        await this.usersService.setOnboardingStep(user.id, 'awaiting_name');
        return `👋 Welcome to *NutriBot*! I'm your personal AI dietician.\n\nLet's set up your profile. What's your full name?`;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  private progressBar(percent: number): string {
    const clamped = Math.min(100, Math.max(0, percent));
    const filled = Math.round(clamped / 10);
    const empty = 10 - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
  }
}
