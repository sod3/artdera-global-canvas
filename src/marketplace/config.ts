import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";
import type { PromotionPlacement, UserRole } from "./types";

export { PLAN_ORDER } from "@/config/subscription-plans";
export const PLANS = SUBSCRIPTION_PLANS;

export const DEMO_MODE = true;
export const DEMO_OTP = "123456";
export const SESSION_DURATION_MS = 60 * 60 * 1000;

export const PROMOTION_PLACEMENTS: PromotionPlacement[] = [
  {
    id: "boost-3",
    name: "Boost artwork for 3 days",
    priceMin: 299,
    priceMax: 299,
    durationDays: 3,
    requiresApproval: false,
    description: "More visibility in relevant browse results.",
  },
  {
    id: "boost-7",
    name: "Boost artwork for 7 days",
    priceMin: 699,
    priceMax: 699,
    durationDays: 7,
    requiresApproval: false,
    description: "A week of measured sponsored discovery.",
  },
  {
    id: "category-top",
    name: "Top category position",
    priceMin: 1499,
    priceMax: 1499,
    durationDays: 7,
    requiresApproval: false,
    description: "Priority placement within one relevant category.",
  },
  {
    id: "featured-artist",
    name: "Featured artist",
    priceMin: 2499,
    priceMax: 2499,
    durationDays: 7,
    requiresApproval: true,
    description: "Editorial seller placement, subject to review.",
  },
  {
    id: "homepage",
    name: "Homepage feature",
    priceMin: 4999,
    priceMax: 4999,
    durationDays: 7,
    requiresApproval: true,
    description: "Homepage placement subject to ArtDera approval.",
  },
  {
    id: "social",
    name: "Social-media promotion package",
    priceMin: 5000,
    priceMax: 15000,
    durationDays: 7,
    requiresApproval: true,
    description: "A scoped social package planned with the ArtDera team.",
  },
  {
    id: "newsletter",
    name: "Newsletter placement",
    priceMin: 2000,
    priceMax: 5000,
    durationDays: 7,
    requiresApproval: true,
    description: "Newsletter consideration based on audience fit.",
  },
];

export const ROUTES = {
  home: "/",
  discover: "/discover",
  sell: "/sell",
  plans: "/sell/plans",
  artistSignup: "/artist/signup",
  artistVerify: "/artist/verify",
  artistCheckout: "/artist/checkout",
  paymentSuccess: "/artist/payment-success",
  paymentFailed: "/artist/payment-failed",
  onboarding: "/artist/onboarding",
  storeCreated: "/artist/store-created",
  login: "/auth/login",
  dashboard: "/artist/dashboard",
  buyer: "/account",
  admin: "/admin",
} as const;

export const ROLE_HOME: Record<UserRole, string> = {
  artist: ROUTES.dashboard,
  gallery: ROUTES.dashboard,
  buyer: ROUTES.buyer,
  admin: ROUTES.admin,
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  buyer: ["shop", "wishlist", "message", "offer", "review"],
  artist: ["manage_store", "manage_artworks", "manage_orders", "message", "promote"],
  gallery: [
    "manage_store",
    "manage_artworks",
    "manage_orders",
    "message",
    "promote",
    "manage_artists",
    "manage_staff",
    "reports",
  ],
  admin: ["moderate", "manage_plans", "manage_users", "manage_content", "view_audit"],
};

export const formatPKR = (value: number) => `Rs. ${new Intl.NumberFormat("en-PK").format(value)}`;
