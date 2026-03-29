export type PlanName = 'free' | 'beta' | 'standard' | 'growth' | 'pro';

export interface PlanLimits {
  dmPerMonth: number;         // -1 = unlimited
  maxCampaigns: number;       // -1 = unlimited
  platformFeePercent: number;
  allowD2C: boolean;
  pricePerMonth: number;      // KRW, 0 = free
}

export const PLAN_CONFIG: Record<PlanName, PlanLimits> = {
  free:     { dmPerMonth: 5_000,   maxCampaigns: 1,  platformFeePercent: 8, allowD2C: false, pricePerMonth: 0 },
  beta:     { dmPerMonth: -1,     maxCampaigns: -1, platformFeePercent: 0, allowD2C: true,  pricePerMonth: 0 },
  standard: { dmPerMonth: 50_000,  maxCampaigns: 5,  platformFeePercent: 8, allowD2C: false, pricePerMonth: 9_900 },
  growth:   { dmPerMonth: 200_000, maxCampaigns: 15, platformFeePercent: 7, allowD2C: true,  pricePerMonth: 49_000 },
  pro:      { dmPerMonth: -1,     maxCampaigns: -1, platformFeePercent: 6, allowD2C: true,  pricePerMonth: 99_000 },
};
