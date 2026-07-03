// src/lib/kodiScore.ts
//
// THE SCORING ENGINE.
// Pure functions — no database calls here. Called by the
// payment confirmation flow (after M-Pesa or bank transfer
// is confirmed) to compute how the score should change.

export type PaymentTiming = 'early' | 'on_time' | 'late' | 'very_late';

export interface ScoreChange {
  delta: number;
  reason: string;
  pointsEarned: number;
}

const SCORE_MIN = 300;
const SCORE_MAX = 999;

/**
 * Classify how a payment lands relative to its due date.
 * daysFromDue: negative = paid early, 0 = on time,
 *              positive = paid late
 */
export function classifyPaymentTiming(daysFromDue: number): PaymentTiming {
  if (daysFromDue <= -2) return 'early';
  if (daysFromDue <= 0) return 'on_time';
  if (daysFromDue <= 7) return 'late';
  return 'very_late';
}

/**
 * Compute the score delta and points earned for a single
 * payment event. Also checks for streak milestone bonuses.
 */
export function computePaymentScoreChange(params: {
  timing: PaymentTiming;
  currentStreak: number; // streak BEFORE this payment
}): ScoreChange {
  const { timing, currentStreak } = params;

  switch (timing) {
    case 'early':
      return {
        delta: 25,
        reason: 'paid_early',
        pointsEarned: 10 + Math.floor(currentStreak / 2), // small streak bonus
      };
    case 'on_time':
      return {
        delta: 15,
        reason: 'on_time_payment',
        pointsEarned: 10 + Math.floor(currentStreak / 2),
      };
    case 'late':
      return {
        delta: -40,
        reason: 'late_payment',
        pointsEarned: 0,
      };
    case 'very_late':
      return {
        delta: -80,
        reason: 'very_late_payment',
        pointsEarned: 0,
      };
  }
}

/**
 * Streak milestones award a one-time bonus on top of the
 * regular payment score change.
 */
const STREAK_MILESTONES: Record<number, { scoreBonus: number; pointsBonus: number }> = {
  3:  { scoreBonus: 20, pointsBonus: 30 },
  6:  { scoreBonus: 30, pointsBonus: 60 },
  12: { scoreBonus: 50, pointsBonus: 150 },
  24: { scoreBonus: 80, pointsBonus: 350 },
};

export function getStreakMilestoneBonus(newStreak: number) {
  return STREAK_MILESTONES[newStreak] ?? null;
}

/**
 * Missing a payment entirely (no payment by ~30 days
 * after due date) resets the streak and applies a heavy
 * penalty. Called by a scheduled job, not the live flow.
 */
export const MISSED_PAYMENT_PENALTY = -150;

/**
 * Clamp a score to the valid 300-999 range.
 */
export function clampScore(score: number): number {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, score));
}

/**
 * Human-readable band label for a given score —
 * used in UI copy ("You're a Reliable tenant").
 */
export function scoreBand(score: number): {
  label: string;
  color: 'danger' | 'pink' | 'sky';
} {
  if (score >= 850) return { label: 'Elite', color: 'sky' };
  if (score >= 700) return { label: 'Trusted', color: 'sky' };
  if (score >= 500) return { label: 'Reliable', color: 'pink' };
  return { label: 'Building trust', color: 'danger' };
}
