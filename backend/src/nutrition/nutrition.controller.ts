import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { NutritionService } from './nutrition.service';
import { FoodLog } from './food-log.entity';

@ApiTags('nutrition')
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/nutrition/:userId/today
  // ──────────────────────────────────────────────────────────────────────────
  @Get(':userId/today')
  @ApiOperation({
    summary: "Get user's food logs for today",
    description: 'Returns all meal entries logged today plus running totals for the day.',
  })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: "Today's food logs and macro totals",
  })
  async getToday(
    @Param('userId') userId: string,
  ): Promise<{
    date: string;
    totals: { calories: number; protein: number; carbs: number; fat: number };
    logs: FoodLog[];
  }> {
    const today = new Date().toISOString().split('T')[0];
    const { logs, ...totals } = await this.nutritionService.getTodayTotals(userId);
    return { date: today, totals, logs };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/nutrition/:userId/week
  // ──────────────────────────────────────────────────────────────────────────
  @Get(':userId/week')
  @ApiOperation({
    summary: "Get user's weekly nutrition stats",
    description: 'Returns average daily calories and macros for the past 7 days.',
  })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'Weekly nutrition averages',
  })
  async getWeekly(@Param('userId') userId: string) {
    const stats = await this.nutritionService.getWeeklyStats(userId);
    return {
      period: 'last 7 days',
      ...stats,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/nutrition/:userId/logs
  // ──────────────────────────────────────────────────────────────────────────
  @Get(':userId/logs')
  @ApiOperation({
    summary: "Get user's food logs for the past week",
    description: 'Returns all individual meal log entries from the last 7 days.',
  })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'List of food log entries', type: [FoodLog] })
  async getWeeklyLogs(@Param('userId') userId: string): Promise<FoodLog[]> {
    return this.nutritionService.getWeeklyLogs(userId);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/nutrition/:userId/history?days=30
  // ──────────────────────────────────────────────────────────────────────────
  @Get(':userId/history')
  @ApiOperation({
    summary: "Get user's historical daily stats",
    description: 'Returns aggregated daily totals for the past X days (default 30).',
  })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'Array of daily aggregated stats',
  })
  async getHistory(
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.nutritionService.getHistoryStats(userId, isNaN(daysNum) ? 30 : daysNum);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/nutrition/:userId/gamification
  // ──────────────────────────────────────────────────────────────────────────
  @Get(':userId/gamification')
  @ApiOperation({
    summary: "Get user's gamification stats",
    description: 'Returns the current streak and badge status for the user.',
  })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Streaks and Badges object' })
  async getGamification(@Param('userId') userId: string) {
    return this.nutritionService.getGamificationStats(userId);
  }
}
