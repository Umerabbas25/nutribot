import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { FoodLog } from './food-log.entity';
import { User } from '../users/user.entity';

interface ParsedMeal {
  isMeal: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);
  private readonly openai: OpenAI;

  constructor(
    @InjectRepository(FoodLog)
    private readonly foodLogRepo: Repository<FoodLog>,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  /**
   * Parse a free-text meal description using OpenAI.
   * Returns estimated nutritional values or flags if it is not a meal log.
   */
  async parseMeal(description: string, userContext?: string): Promise<ParsedMeal> {
    const systemPrompt = `You are a professional nutritionist. Given a message from a user, determine if they are describing a meal they ate/drank.
If they are NOT describing a meal (e.g. asking a question, saying hello, or asking for remaining calories), set "isMeal" to false.
If they are describing a meal, set "isMeal" to true and extract nutritional information.
Always respond with a valid JSON object. Estimate for average Pakistani/South Asian portion sizes unless clearly stated otherwise.
${userContext ? `User context: ${userContext}` : ''}`;

    const userPrompt = `Message: "${description}"

Respond ONLY with JSON in this exact format:
{
  "isMeal": <boolean>,
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "items": ["food item 1", "food item 2"],
  "confidence": "high" | "medium" | "low"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content) as ParsedMeal;
    } catch (error) {
      this.logger.error('Groq meal parsing failed', error);
      // Return a fallback estimate
      return {
        isMeal: true,
        calories: 300,
        protein: 15,
        carbs: 40,
        fat: 8,
        items: [description],
        confidence: 'low',
      };
    }
  }

  /**
   * Answer a general question when the user is not logging a meal.
   */
  async handleGeneralQuestion(user: User, text: string, todayTotals: DailyTotals): Promise<{ suggestion: string }> {
    const remaining = {
      calories: user.dailyCalorieTarget - todayTotals.calories,
      protein: user.proteinGrams - todayTotals.protein,
      carbs: user.carbsGrams - todayTotals.carbs,
      fat: user.fatGrams - todayTotals.fat,
    };
    
    const prompt = `You are NutriBot, a friendly AI dietician. The user asked a question or sent a message: "${text}"
Answer their question helpfully and conversationally. Keep it under 100 words.
If relevant to their question, here are their stats today: they have logged ${todayTotals.calories} kcal, and have ${remaining.calories} kcal remaining out of their ${user.dailyCalorieTarget} kcal target.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'llama3-70b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 150,
      });
      return { suggestion: response.choices[0]?.message?.content || 'I am here to help with your nutrition!' };
    } catch(err) {
      return { suggestion: "I'm having trouble thinking right now. Please try again!" };
    }
  }

  /**
   * Generate a dietician-style suggestion based on the user's daily progress.
   */
  async generateSuggestion(
    user: User,
    newMeal: ParsedMeal,
    todayTotals: DailyTotals,
    mealDescription: string,
  ): Promise<string> {
    const remaining = {
      calories: user.dailyCalorieTarget - todayTotals.calories,
      protein: user.proteinGrams - todayTotals.protein,
      carbs: user.carbsGrams - todayTotals.carbs,
      fat: user.fatGrams - todayTotals.fat,
    };

    const conditions = user.conditions && user.conditions !== 'none' ? user.conditions : 'none';
    const allergies = user.allergies && user.allergies !== 'none' ? user.allergies : 'none';

    const prompt = `You are NutriBot, a friendly AI dietician. Be warm, encouraging, and specific.
Keep your response under 200 words and use WhatsApp formatting (*bold*, _italic_, emojis).

User profile:
- Name: ${user.name || 'there'}
- Medical conditions: ${conditions}
- Allergies: ${allergies}
- Daily targets: ${user.dailyCalorieTarget} kcal, ${user.proteinGrams}g protein, ${user.carbsGrams}g carbs, ${user.fatGrams}g fat

They just logged: "${mealDescription}"
This meal: ~${newMeal.calories} kcal, ${newMeal.protein}g protein, ${newMeal.carbs}g carbs, ${newMeal.fat}g fat

Running daily total so far: ${todayTotals.calories} kcal, ${todayTotals.protein}g protein, ${todayTotals.carbs}g carbs, ${todayTotals.fat}g fat

Remaining for today: ${remaining.calories} kcal, ${remaining.protein}g protein, ${remaining.carbs}g carbs, ${remaining.fat}g fat

Give a response that:
1. Acknowledges their meal briefly
2. Shows their remaining targets for the day
3. Gives 1-2 specific food suggestions for their next meal based on what's lacking
4. Flags any concern if they have relevant medical conditions
Keep it conversational and motivating.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'llama3-70b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      });
      return response.choices[0]?.message?.content || 'Great job logging your meal! Keep it up! 🥗';
    } catch (error) {
      this.logger.error('Groq suggestion generation failed', error);
      return (
        `✅ Logged! You've had *${todayTotals.calories} kcal* today.\n` +
        `Remaining: *${remaining.calories} kcal* | *${remaining.protein}g* protein\n\n` +
        `Keep going! 💪`
      );
    }
  }

  /**
   * Log a meal and return AI suggestion, or answer a general query.
   */
  async logMealAndGetSuggestion(
    user: User,
    mealDescription: string,
  ): Promise<{ log?: FoodLog; suggestion: string }> {
    const today = new Date().toISOString().split('T')[0];

    // Build user context for OpenAI
    const userContext =
      user.conditions && user.conditions !== 'none'
        ? `Has ${user.conditions}. Allergic to: ${user.allergies || 'nothing'}.`
        : '';

    // 1. Parse the meal
    const parsed = await this.parseMeal(mealDescription, userContext);

    // 2. Get today's existing totals
    const existingLogs = await this.foodLogRepo.find({
      where: { userId: user.id, date: today },
    });
    const existingTotals = existingLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    if (parsed.isMeal === false) {
      // It's a conversational message, not a meal log
      return this.handleGeneralQuestion(user, mealDescription, existingTotals);
    }

    // 3. Generate suggestion (pass totals BEFORE adding new meal)
    const suggestion = await this.generateSuggestion(
      user,
      parsed,
      existingTotals,
      mealDescription,
    );

    // 4. Save log entry
    const log = await this.foodLogRepo.save(
      this.foodLogRepo.create({
        userId: user.id,
        date: today,
        mealDescription,
        calories: parsed.calories,
        protein: parsed.protein,
        carbs: parsed.carbs,
        fat: parsed.fat,
        aiSuggestion: suggestion,
      }),
    );

    return { log, suggestion };
  }

  /**
   * Get today's totals for a user.
   */
  async getTodayTotals(userId: string): Promise<DailyTotals & { logs: FoodLog[] }> {
    const today = new Date().toISOString().split('T')[0];
    const logs = await this.foodLogRepo.find({ where: { userId, date: today } });
    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    return { ...totals, logs };
  }

  /**
   * Get logs for the past 7 days for a user (used for weekly email).
   */
  async getWeeklyLogs(userId: string): Promise<FoodLog[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];

    return this.foodLogRepo
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.date >= :fromDate', { fromDate })
      .orderBy('log.date', 'ASC')
      .getMany();
  }

  /**
   * Calculate weekly averages for email summary.
   */
  async getWeeklyStats(
    userId: string,
  ): Promise<{ avgCalories: number; avgProtein: number; avgCarbs: number; avgFat: number; daysLogged: number }> {
    const logs = await this.getWeeklyLogs(userId);
    if (logs.length === 0) {
      return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, daysLogged: 0 };
    }

    // Group by date to count days
    const days = new Set(logs.map((l) => l.date)).size;
    const totals = logs.reduce(
      (acc, l) => ({
        calories: acc.calories + l.calories,
        protein: acc.protein + l.protein,
        carbs: acc.carbs + l.carbs,
        fat: acc.fat + l.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return {
      avgCalories: Math.round(totals.calories / days),
      avgProtein: Math.round(totals.protein / days),
      avgCarbs: Math.round(totals.carbs / days),
      avgFat: Math.round(totals.fat / days),
      daysLogged: days,
    };
  }

  /**
   * Get historical daily totals for charts (e.g. 7 days or 30 days)
   */
  async getHistoryStats(
    userId: string,
    days: number,
  ): Promise<{ date: string; calories: number; protein: number; carbs: number; fat: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const fromDate = startDate.toISOString().split('T')[0];

    const logs = await this.foodLogRepo
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.date >= :fromDate', { fromDate })
      .orderBy('log.date', 'ASC')
      .getMany();

    // Group by date
    const dailyMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
    
    // Initialize map with empty days to ensure we have a continuous timeline
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - days + 1 + i);
      dailyMap.set(d.toISOString().split('T')[0], { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }

    // Accumulate logs
    logs.forEach(log => {
      const current = dailyMap.get(log.date);
      if (current) {
        current.calories += log.calories;
        current.protein += log.protein;
        current.carbs += log.carbs;
        current.fat += log.fat;
      }
    });

    // Convert to array
    const result = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      calories: Math.round(stats.calories),
      protein: Math.round(stats.protein),
      carbs: Math.round(stats.carbs),
      fat: Math.round(stats.fat),
    }));

    return result;
  }

  /**
   * Get Gamification Stats (Streaks & Badges)
   */
  async getGamificationStats(userId: string) {
    const user = await this.foodLogRepo.manager.findOne(User, { where: { id: userId } });
    if (!user) throw new Error('User not found');

    // 1. Calculate Streak
    // Get all unique dates the user has logged meals
    const logs = await this.foodLogRepo
      .createQueryBuilder('log')
      .select('log.date', 'log_date')
      .addSelect('SUM(log.protein)', 'totalProtein')
      .where('log.userId = :userId', { userId: user.id })
      .groupBy('log.date')
      .orderBy('log.date', 'DESC')
      .getRawMany();

    let currentStreak = 0;
    let metProteinTargetDays = 0;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Array of string dates sorted DESC
    let checkDate = new Date();
    
    // Check if they logged today or yesterday to start the streak
    if (logs.length > 0) {
      if (logs[0].log_date === todayStr || logs[0].log_date === yesterdayStr) {
        // They have an active streak
        for (let i = 0; i < logs.length; i++) {
          const logDateStr = logs[i].log_date;
          // Calculate expected date string
          const expectedDate = new Date(today);
          if (logs[0].log_date === yesterdayStr) {
             expectedDate.setDate(today.getDate() - 1 - i);
          } else {
             expectedDate.setDate(today.getDate() - i);
          }
          const expectedStr = expectedDate.toISOString().split('T')[0];
          
          if (logDateStr === expectedStr) {
            currentStreak++;
          } else {
            break; // Streak broken
          }
        }
      }
    }

    // Check last 3 logged days for protein
    for (let i = 0; i < Math.min(3, logs.length); i++) {
      if (Number(logs[i].totalProtein) >= (user.proteinGrams * 0.9)) {
        metProteinTargetDays++;
      }
    }

    // 2. Define Badges
    const badges = [
      {
        id: 'first_meal',
        name: 'First Meal Logged',
        icon: '🥗',
        description: 'Logged your very first meal.',
        achieved: logs.length > 0
      },
      {
        id: 'streak_3',
        name: '3-Day Streak',
        icon: '🔥',
        description: 'Logged meals 3 days in a row.',
        achieved: currentStreak >= 3
      },
      {
        id: 'streak_7',
        name: '7-Day Streak',
        icon: '🏆',
        description: 'Logged meals 7 days in a row.',
        achieved: currentStreak >= 7
      },
      {
        id: 'protein_master',
        name: 'Protein Master',
        icon: '🥩',
        description: 'Met your protein target 3 days in a row.',
        achieved: metProteinTargetDays >= 3
      }
    ];

    return { currentStreak, badges };
  }
}
