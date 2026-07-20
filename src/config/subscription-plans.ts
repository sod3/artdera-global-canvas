import type { BillingCycle, PlanId, SubscriptionPlan } from "@/marketplace/types";

export const SUBSCRIPTION_PLANS = {} as Record<PlanId, SubscriptionPlan>;
export const PLAN_ORDER: PlanId[] = ["free", "professional", "pro-plus", "gallery"];
export const PLAN_RANK: Record<PlanId, number> = { free: 0, professional: 1, "pro-plus": 2, gallery: 3 };

export function hydrateSubscriptionPlans(plans: SubscriptionPlan[]) {
  for (const key of Object.keys(SUBSCRIPTION_PLANS)) delete SUBSCRIPTION_PLANS[key as PlanId];
  for (const plan of plans) SUBSCRIPTION_PLANS[plan.id] = plan;
}

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && PLAN_ORDER.includes(value as PlanId);
}

export function planPrice(planId: PlanId, billingCycle: BillingCycle) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) return 0;
  if (planId === "free") return 0;
  if (billingCycle === "annual" && plan.annualPrice !== undefined) return plan.annualPrice;
  return plan.monthlyPrice;
}

export function validBillingCycle(planId: PlanId, value: unknown) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (planId === "free") return "free" as const;
  if (value === "annual" && plan?.billingOptions.includes("annual")) return "annual" as const;
  return "monthly" as const;
}

export function annualSavings(planId: PlanId) {
  const plan = SUBSCRIPTION_PLANS[planId];
  return plan?.annualPrice ? plan.monthlyPrice * 12 - plan.annualPrice : 0;
}
