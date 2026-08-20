import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { User } from '../users/user.entity';

interface WeeklyStats {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  daysLogged: number;
}

interface DailyStats {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  /**
   * Send a welcome email after profile creation.
   */
  async sendWelcomeEmail(user: User): Promise<void> {
    if (!user.email) return;

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.RESEND_FROM_NAME || 'NutriBot';

    try {
      const { error } = await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [user.email],
        subject: `Welcome to NutriBot, ${user.name}! 🥗`,
        html: this.buildWelcomeEmailHtml(user),
      });

      if (error) {
        this.logger.error('Resend welcome email failed', error);
      } else {
        this.logger.log(`✉️  Welcome email sent to ${user.email}`);
      }
    } catch (err) {
      this.logger.error('Email send exception', err);
    }
  }

  /**
   * Send the weekly nutrition summary email.
   */
  async sendWeeklySummary(user: User, stats: WeeklyStats): Promise<void> {
    if (!user.email) return;
    if (stats.daysLogged === 0) return; // Don't send if no data

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.RESEND_FROM_NAME || 'NutriBot';

    try {
      const { error } = await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [user.email],
        subject: `Your Weekly Nutrition Report 📊`,
        html: this.buildWeeklySummaryHtml(user, stats),
      });

      if (error) {
        this.logger.error(`Resend weekly email failed for ${user.email}`, error);
      } else {
        this.logger.log(`✉️  Weekly summary sent to ${user.email}`);
      }
    } catch (err) {
      this.logger.error('Weekly email send exception', err);
    }
  }

  /**
   * Send the daily nutrition summary email.
   */
  async sendDailySummary(user: User, stats: DailyStats): Promise<void> {
    if (!user.email) return;

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.RESEND_FROM_NAME || 'NutriBot';

    try {
      const { error } = await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [user.email],
        subject: `Your Daily Nutrition Report 🥗`,
        html: this.buildDailySummaryHtml(user, stats),
      });

      if (error) {
        this.logger.error(`Resend daily email failed for ${user.email}`, error);
      } else {
        this.logger.log(`📬  Daily summary sent to ${user.email}`);
      }
    } catch (err) {
      this.logger.error('Daily email send exception', err);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // EMAIL TEMPLATES
  // ────────────────────────────────────────────────────────────────────────────

  private buildWelcomeEmailHtml(user: User): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to NutriBot</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:linear-gradient(135deg,#0f766e,#065f46);border-radius:16px;padding:40px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:8px;">🥗</div>
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Welcome to NutriBot!</h1>
      <p style="color:#a7f3d0;margin:8px 0 0;">Your AI-Powered Personal Dietician</p>
    </div>

    <div style="background:#1e293b;border-radius:16px;padding:32px;margin-bottom:24px;border:1px solid #334155;">
      <h2 style="color:#f1f5f9;margin:0 0 20px;font-size:20px;">Hi ${user.name || 'there'} 👋</h2>
      <p style="color:#94a3b8;line-height:1.6;margin:0 0 16px;">
        Your NutriBot profile is all set! Here are your personalised daily nutrition targets based on your profile:
      </p>

      <div style="display:grid;gap:12px;">
        <div style="background:#0f172a;border-radius:12px;padding:16px;border-left:4px solid #0f766e;">
          <div style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Daily Calories</div>
          <div style="color:#f1f5f9;font-size:24px;font-weight:700;">${user.dailyCalorieTarget || 0} <span style="font-size:14px;color:#64748b;">kcal</span></div>
        </div>
        <table style="width:100%;border-collapse:separate;border-spacing:8px;">
          <tr>
            <td style="background:#0f172a;border-radius:12px;padding:16px;border-left:4px solid #3b82f6;">
              <div style="color:#64748b;font-size:11px;text-transform:uppercase;">Protein</div>
              <div style="color:#f1f5f9;font-size:20px;font-weight:700;">${user.proteinGrams || 0}g</div>
            </td>
            <td style="background:#0f172a;border-radius:12px;padding:16px;border-left:4px solid #f59e0b;">
              <div style="color:#64748b;font-size:11px;text-transform:uppercase;">Carbs</div>
              <div style="color:#f1f5f9;font-size:20px;font-weight:700;">${user.carbsGrams || 0}g</div>
            </td>
            <td style="background:#0f172a;border-radius:12px;padding:16px;border-left:4px solid #ef4444;">
              <div style="color:#64748b;font-size:11px;text-transform:uppercase;">Fat</div>
              <div style="color:#f1f5f9;font-size:20px;font-weight:700;">${user.fatGrams || 0}g</div>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div style="background:#1e293b;border-radius:16px;padding:32px;margin-bottom:24px;border:1px solid #334155;">
      <h3 style="color:#f1f5f9;margin:0 0 16px;font-size:16px;">🚀 Getting Started</h3>
      <ol style="color:#94a3b8;line-height:2;margin:0;padding-left:20px;">
        <li>Open WhatsApp and message NutriBot</li>
        <li>Just tell it what you ate — in plain language</li>
        <li>Get instant analysis and suggestions from your AI dietician</li>
        <li>Check your daily progress anytime by typing <strong style="color:#34d399;">today</strong></li>
      </ol>
    </div>

    <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
      You're receiving this because you signed up at NutriBot. 
      <br>© 2024 NutriBot — Your AI Dietician
    </p>
  </div>
</body>
</html>`;
  }

  private buildWeeklySummaryHtml(user: User, stats: WeeklyStats): string {
    const calPct = user.dailyCalorieTarget
      ? Math.round((stats.avgCalories / user.dailyCalorieTarget) * 100)
      : 0;
    const proteinPct = user.proteinGrams
      ? Math.round((stats.avgProtein / user.proteinGrams) * 100)
      : 0;

    const calColor = calPct < 80 ? '#3b82f6' : calPct > 110 ? '#ef4444' : '#10b981';
    const proteinColor = proteinPct < 80 ? '#ef4444' : '#10b981';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Weekly Nutrition Report</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:linear-gradient(135deg,#0f766e,#065f46);border-radius:16px;padding:40px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:8px;">📊</div>
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Your Weekly Report</h1>
      <p style="color:#a7f3d0;margin:8px 0 0;">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>

    <div style="background:#1e293b;border-radius:16px;padding:32px;margin-bottom:24px;border:1px solid #334155;">
      <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:20px;">Hey ${user.name || 'there'}! 👋</h2>
      <p style="color:#94a3b8;margin:0 0 24px;">
        You tracked <strong style="color:#34d399;">${stats.daysLogged} out of 7 days</strong> this week. Here's how you did:
      </p>

      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#94a3b8;">Avg. Calories</span>
          <span style="color:${calColor};font-weight:700;">${stats.avgCalories} / ${user.dailyCalorieTarget} kcal (${calPct}%)</span>
        </div>
        <div style="background:#334155;border-radius:999px;height:8px;overflow:hidden;">
          <div style="background:${calColor};height:100%;width:${Math.min(calPct, 100)}%;border-radius:999px;"></div>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#94a3b8;">Avg. Protein</span>
          <span style="color:${proteinColor};font-weight:700;">${stats.avgProtein}g / ${user.proteinGrams}g (${proteinPct}%)</span>
        </div>
        <div style="background:#334155;border-radius:999px;height:8px;overflow:hidden;">
          <div style="background:${proteinColor};height:100%;width:${Math.min(proteinPct, 100)}%;border-radius:999px;"></div>
        </div>
      </div>

      <table style="width:100%;border-collapse:separate;border-spacing:8px;margin-top:16px;">
        <tr>
          <td style="background:#0f172a;border-radius:12px;padding:16px;text-align:center;">
            <div style="color:#64748b;font-size:11px;text-transform:uppercase;">Avg. Carbs</div>
            <div style="color:#f59e0b;font-size:22px;font-weight:700;">${stats.avgCarbs}g</div>
          </td>
          <td style="background:#0f172a;border-radius:12px;padding:16px;text-align:center;">
            <div style="color:#64748b;font-size:11px;text-transform:uppercase;">Avg. Fat</div>
            <div style="color:#ef4444;font-size:22px;font-weight:700;">${stats.avgFat}g</div>
          </td>
          <td style="background:#0f172a;border-radius:12px;padding:16px;text-align:center;">
            <div style="color:#64748b;font-size:11px;text-transform:uppercase;">Days Tracked</div>
            <div style="color:#34d399;font-size:22px;font-weight:700;">${stats.daysLogged}/7</div>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:#1e293b;border-radius:16px;padding:24px;border:1px solid #334155;text-align:center;">
      <p style="color:#94a3b8;margin:0 0 16px;">Keep logging your meals on WhatsApp for a better next week! 💪</p>
    </div>

    <p style="color:#475569;font-size:12px;text-align:center;margin:24px 0 0;">
      © 2024 NutriBot — Your AI Dietician
    </p>
  </div>
</body>
</html>`;
  }

  private buildDailySummaryHtml(user: User, stats: DailyStats): string {
    const calPct = user.dailyCalorieTarget
      ? Math.round((stats.calories / user.dailyCalorieTarget) * 100)
      : 0;

    const proteinPct = user.proteinGrams
      ? Math.round((stats.protein / user.proteinGrams) * 100)
      : 0;

    const calColor = calPct < 80 ? '#3b82f6' : calPct > 110 ? '#ef4444' : '#10b981';
    const proteinColor = proteinPct < 80 ? '#ef4444' : '#10b981';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Daily Nutrition Report</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:linear-gradient(135deg,#0f766e,#065f46);border-radius:16px;padding:40px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:8px;">🥗</div>
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Your Daily Report</h1>
      <p style="color:#a7f3d0;margin:8px 0 0;">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>

    <div style="background:#1e293b;border-radius:16px;padding:32px;margin-bottom:24px;border:1px solid #334155;">
      <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:20px;">Hey ${user.name || 'there'}! 👋</h2>
      <p style="color:#94a3b8;margin:0 0 24px;">
        Here is your summary for today:
      </p>

      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#94a3b8;">Calories</span>
          <span style="color:${calColor};font-weight:700;">${stats.calories} / ${user.dailyCalorieTarget} kcal (${calPct}%)</span>
        </div>
        <div style="background:#334155;border-radius:999px;height:8px;overflow:hidden;">
          <div style="background:${calColor};height:100%;width:${Math.min(calPct, 100)}%;border-radius:999px;"></div>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#94a3b8;">Protein</span>
          <span style="color:${proteinColor};font-weight:700;">${stats.protein}g / ${user.proteinGrams}g (${proteinPct}%)</span>
        </div>
        <div style="background:#334155;border-radius:999px;height:8px;overflow:hidden;">
          <div style="background:${proteinColor};height:100%;width:${Math.min(proteinPct, 100)}%;border-radius:999px;"></div>
        </div>
      </div>

      <table style="width:100%;border-collapse:separate;border-spacing:8px;margin-top:16px;">
        <tr>
          <td style="background:#0f172a;border-radius:12px;padding:16px;text-align:center;">
            <div style="color:#64748b;font-size:11px;text-transform:uppercase;">Carbs</div>
            <div style="color:#f59e0b;font-size:22px;font-weight:700;">${stats.carbs}g</div>
          </td>
          <td style="background:#0f172a;border-radius:12px;padding:16px;text-align:center;">
            <div style="color:#64748b;font-size:11px;text-transform:uppercase;">Fat</div>
            <div style="color:#ef4444;font-size:22px;font-weight:700;">${stats.fat}g</div>
          </td>
        </tr>
      </table>
    </div>

    <p style="color:#475569;font-size:12px;text-align:center;margin:24px 0 0;">
      © 2024 NutriBot — Your AI Dietician
    </p>
  </div>
</body>
</html>`;
  }
}
