export type PlanName = 'free' | 'standard' | 'growth' | 'pro';

export interface PlanLimits {
  dmPerMonth: number;         // -1 = unlimited
  maxCampaigns: number;       // -1 = unlimited
  platformFeePercent: number;
  allowD2C: boolean;
}

export const PLAN_CONFIG: Record<PlanName, PlanLimits> = {
  free:     { dmPerMonth: 1_000,  maxCampaigns: 1,  platformFeePercent: 8, allowD2C: false },
  standard: { dmPerMonth: 10_000, maxCampaigns: 3,  platformFeePercent: 8, allowD2C: false },
  growth:   { dmPerMonth: 50_000, maxCampaigns: 10, platformFeePercent: 7,  allowD2C: false },
  pro:      { dmPerMonth: -1,     maxCampaigns: -1, platformFeePercent: 6,  allowD2C: true  },
};
