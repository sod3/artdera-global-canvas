import type { PlanId, SubscriptionPlan } from "@/marketplace/types";

const artistCore = [
  "overview",
  "store",
  "artworks",
  "add-artwork",
  "orders",
  "messages",
  "promotions",
  "shipping",
  "payouts",
  "reviews",
  "verification",
  "subscription",
  "support",
  "settings",
];

export const SUBSCRIPTION_PLANS: Record<PlanId, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    listingLimit: 5,
    commission: 2,
    profile: "Basic artist profile",
    analytics: "Basic",
    payoutTime: "7–10 working days",
    features: [
      "5 active artworks",
      "Basic artist profile",
      "Basic analytics",
      "Orders, messages and promotions",
    ],
    billingOptions: ["free"],
    buttonLabel: "Start Free",
    styleId: "free",
    allowedModules: [...artistCore, "analytics"],
    lockedModules: [
      "detailed-analytics",
      "advanced-analytics",
      "customers",
      "international-tools",
      "priority-support",
      "premium-url",
    ],
    upgradeTarget: "professional",
    sellerType: "artist",
    verification: "Verification review available",
  },
  professional: {
    id: "professional",
    name: "Professional",
    monthlyPrice: 1999,
    annualPrice: 22990,
    listingLimit: 50,
    commission: 1.5,
    profile: "Verified professional profile",
    analytics: "Detailed",
    payoutTime: "5–7 working days",
    recommended: true,
    features: [
      "50 active artworks",
      "Verified professional profile review",
      "Detailed analytics",
      "Portfolio link",
      "Priority support",
    ],
    billingOptions: ["monthly", "annual"],
    buttonLabel: "Choose Professional",
    styleId: "professional",
    allowedModules: [...artistCore, "analytics", "portfolio", "priority-support"],
    lockedModules: ["advanced-analytics", "customers", "premium-url", "international-tools"],
    upgradeTarget: "pro-plus",
    sellerType: "artist",
    verification: "Professional verification review included",
  },
  "pro-plus": {
    id: "pro-plus",
    name: "Pro Plus",
    monthlyPrice: 3999,
    annualPrice: 34999,
    listingLimit: 200,
    commission: 1,
    profile: "Verified badge after approval",
    analytics: "Advanced",
    payoutTime: "Priority payout policy",
    features: [
      "200 active artworks",
      "Advanced analytics",
      "International buyer tools",
      "Premium artist store URL",
      "Customer-management tools",
    ],
    billingOptions: ["monthly", "annual"],
    buttonLabel: "Choose Pro Plus",
    styleId: "pro-plus",
    allowedModules: [
      ...artistCore,
      "analytics",
      "advanced-analytics",
      "customers",
      "premium-url",
      "international-tools",
    ],
    lockedModules: [],
    upgradeTarget: "gallery",
    sellerType: "artist",
    verification: "Verification review included",
  },
  gallery: {
    id: "gallery",
    name: "Gallery",
    monthlyPrice: 10000,
    listingLimit: null,
    commission: 0,
    profile: "Gallery storefront",
    analytics: "Advanced",
    payoutTime: "Gallery settlement policy",
    staffLimit: "3–10",
    features: [
      "Fair-use unlimited listings",
      "3–10 staff accounts",
      "Gallery storefront and CRM",
      "Artist and inventory management",
      "Exhibition pages and reports",
    ],
    billingOptions: ["monthly"],
    buttonLabel: "Choose Gallery",
    styleId: "gallery",
    allowedModules: [
      ...artistCore,
      "analytics",
      "advanced-analytics",
      "customers",
      "premium-url",
      "international-tools",
      "managed-artists",
      "add-artist",
      "staff",
      "staff-permissions",
      "inventory",
      "exhibitions",
      "gallery-crm",
      "reports",
    ],
    lockedModules: [],
    sellerType: "gallery",
    verification: "Gallery document and portfolio review included",
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "professional", "pro-plus", "gallery"];

export const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  professional: 1,
  "pro-plus": 2,
  gallery: 3,
};

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && PLAN_ORDER.includes(value as PlanId);
}

export function planPrice(planId: PlanId, billingCycle: "monthly" | "annual" | "free") {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (planId === "free") return 0;
  if (billingCycle === "annual" && plan.annualPrice) return plan.annualPrice;
  return plan.monthlyPrice;
}

export function validBillingCycle(planId: PlanId, value: unknown) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (planId === "free") return "free" as const;
  if (value === "annual" && plan.annualPrice) return "annual" as const;
  return "monthly" as const;
}

export function annualSavings(planId: PlanId) {
  const plan = SUBSCRIPTION_PLANS[planId];
  return plan.annualPrice ? plan.monthlyPrice * 12 - plan.annualPrice : 0;
}
