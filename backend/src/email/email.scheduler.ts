import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from './email.service';
import { UsersService } from '../users/users.service';
import { NutritionService } from '../nutrition/nutrition.service';

@Injectable()
export class EmailScheduler {
  private readonly logger = new Logger(EmailScheduler.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly nutritionService: NutritionService,
  ) {}

  /**
   * Every Monday at 9:00 AM — send weekly summary to all users who have email.
   */
  @Cron('0 9 * * 1', { name: 'weekly-summary' })
  async sendWeeklySummaries(): Promise<void> {
    this.logger.log('📧 Starting weekly email summary job...');

    const users = await this.usersService.findAll();
    const usersWithEmail = users.filter((u) => u.email && u.onboardingStep === 'complete');

    this.logger.log(`Found ${usersWithEmail.length} users with email addresses`);

    let sent = 0;
    let skipped = 0;

    for (const user of usersWithEmail) {
      try {
        const stats = await this.nutritionService.getWeeklyStats(user.id);
        if (stats.daysLogged > 0) {
          await this.emailService.sendWeeklySummary(user, stats);
          sent++;
        } else {
          this.logger.debug(`Skipping ${user.email} — no meals logged this week`);
          skipped++;
        }
      } catch (err) {
        this.logger.error(`Failed to send weekly email to ${user.email}`, err);
      }
    }

    this.logger.log(`✅ Weekly email job complete. Sent: ${sent}, Skipped: ${skipped}`);
  }
}
