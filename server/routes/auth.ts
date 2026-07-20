import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { getEnv } from "../config/env";
import {
  ArtistProfileModel,
  AuthSessionModel,
  GalleryProfileModel,
  ListingQuotaModel,
  OneTimeTokenModel,
  PendingPlanSelectionModel,
  SubscriptionModel,
  UserModel,
} from "../models";
import { ApiError, asyncRoute, ok } from "../lib/http";
import {
  constantTimeEqual,
  hashToken,
  normalizeEmail,
  normalizePhone,
  randomToken,
  sanitizeText,
} from "../lib/security";
import { SESSION_COOKIE, requireAuth } from "../middleware/auth";
import { serializeSubscription, serializeUser } from "../lib/serializers";
import { emailProvider } from "../services/email";
import { notify } from "../services/notifications";
import { PLAN_SELECTION_COOKIE } from "./plans";
import { getActivePlan } from "../services/plans";
import { audit } from "../services/audit";

export const authRouter = Router();
const SESSION_MS = 7 * 24 * 60 * 60_000;

const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/\d/, "Add a number")
  .regex(/[^A-Za-z0-9]/, "Add a symbol");

function cookieOptions() {
  const env = getEnv();
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MS,
  };
}

async function startSession(req: Parameters<typeof audit>[0], res: Parameters<typeof ok>[0], userId: unknown) {
  const token = randomToken();
  await AuthSessionModel.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_MS),
    ipAddress: req.ip,
    userAgent: req.get("user-agent")?.slice(0, 500),
  });
  res.cookie(SESSION_COOKIE, token, cookieOptions());
}

async function issueCode(userId: unknown, purpose: "email_verification" | "phone_verification" | "password_reset") {
  const env = getEnv();
  const recent = await OneTimeTokenModel.findOne({ userId, purpose, consumedAt: { $exists: false } })
    .sort({ createdAt: -1 })
    .lean();
  if (recent?.sentAt && recent.sentAt.getTime() > Date.now() - 60_000) {
    throw new ApiError(429, "OTP_COOLDOWN", "Please wait before requesting another code");
  }
  await OneTimeTokenModel.updateMany(
    { userId, purpose, consumedAt: { $exists: false } },
    { $set: { consumedAt: new Date() } },
  );
  const code = env.DEMO_OTP_MODE ? env.DEMO_OTP_CODE! : String(randomInt(100_000, 1_000_000));
  await OneTimeTokenModel.create({
    userId,
    purpose,
    tokenHash: hashToken(code),
    expiresAt: new Date(Date.now() + 10 * 60_000),
    sentAt: new Date(),
  });
  return code;
}

async function verifyCode(userId: unknown, purpose: string, code: string) {
  const record = await OneTimeTokenModel.findOne({
    userId,
    purpose,
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .select("+tokenHash");
  if (!record || record.attempts >= 5) {
    throw new ApiError(422, "INVALID_OR_EXPIRED_CODE", "The code is invalid or has expired");
  }
  record.attempts += 1;
  if (!constantTimeEqual(record.tokenHash, hashToken(code))) {
    await record.save();
    throw new ApiError(422, "INVALID_OR_EXPIRED_CODE", "The code is invalid or has expired");
  }
  record.consumedAt = new Date();
  await record.save();
}

async function destinationFor(user: { _id: unknown; role: string; emailVerified: boolean }) {
  if (user.role === "admin") return "/admin";
  if (user.role === "buyer") return "/account";
  if (!user.emailVerified) return "/artist/verify";
  const subscription = await SubscriptionModel.findOne({ userId: user._id }).sort({ createdAt: -1 }).lean();
  if (!subscription) return "/sell/plans";
  if (subscription.planId !== "free" && subscription.status !== "active") return "/artist/checkout";
  const profile =
    user.role === "gallery"
      ? await GalleryProfileModel.findOne({ userId: user._id }).lean()
      : await ArtistProfileModel.findOne({ userId: user._id }).lean();
  return profile?.onboardingCompleted ? "/artist/dashboard" : "/artist/onboarding";
}

authRouter.post(
  "/register",
  asyncRoute(async (req, res) => {
    const input = z
      .object({
        fullName: z.string().trim().min(2).max(120),
        email: z.string().email().max(254),
        phone: z.string().trim().min(7).max(30).optional(),
        mobile: z.string().trim().min(7).max(30).optional(),
        password: passwordSchema,
        role: z.enum(["buyer", "artist", "gallery"]).default("buyer"),
        sellerType: z.string().trim().max(80).optional(),
        city: z.string().trim().min(2).max(100),
        province: z.string().trim().max(100).optional(),
        country: z.string().trim().max(80).default("Pakistan"),
        termsAccepted: z.boolean().optional(),
        privacyAccepted: z.boolean().optional(),
        terms: z.boolean().optional(),
        planId: z.enum(["free", "professional", "pro-plus", "gallery"]).optional(),
        billingCycle: z.enum(["free", "monthly", "annual"]).optional(),
      })
      .strict()
      .parse(req.body);
    if (!(input.termsAccepted ?? input.terms))
      throw new ApiError(422, "TERMS_REQUIRED", "Accept the Terms and Privacy Policy to continue");
    const emailNormalized = normalizeEmail(input.email);
    const phone = input.phone ?? input.mobile;
    const phoneNormalized = normalizePhone(phone);
    const exists = await UserModel.exists({
      $or: [
        { emailNormalized },
        ...(phoneNormalized ? [{ phoneNormalized }] : []),
      ],
    });
    if (exists) throw new ApiError(409, "ACCOUNT_EXISTS", "An account already uses that email or phone");

    let selection: { planId: string; billingCycle: string } | undefined;
    const selectionToken = req.cookies?.[PLAN_SELECTION_COOKIE] as string | undefined;
    if (selectionToken) {
      const pending = await PendingPlanSelectionModel.findOne({
        tokenHash: hashToken(selectionToken),
        expiresAt: { $gt: new Date() },
      })
        .select("+tokenHash")
        .lean();
      if (pending) selection = { planId: pending.planId, billingCycle: pending.billingCycle };
    }
    if (!selection && input.planId) {
      selection = { planId: input.planId, billingCycle: input.billingCycle ?? (input.planId === "free" ? "free" : "monthly") };
    }
    if (["artist", "gallery"].includes(input.role) && !selection)
      throw new ApiError(422, "PLAN_SELECTION_REQUIRED", "Choose a valid plan before creating a seller account");
    if (input.role === "gallery" && selection?.planId !== "gallery")
      throw new ApiError(422, "GALLERY_PLAN_REQUIRED", "Gallery accounts require the Gallery plan");

    const now = new Date();
    const user = await UserModel.create({
      fullName: sanitizeText(input.fullName, 120),
      email: emailNormalized,
      emailNormalized,
      phone,
      phoneNormalized,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
      sellerType: input.role === "buyer" ? null : input.role,
      status: "pending_verification",
      city: sanitizeText(input.city, 100),
      province: input.province ? sanitizeText(input.province, 100) : undefined,
      country: sanitizeText(input.country, 80),
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
    });

    if (input.role === "artist") {
      await ArtistProfileModel.create({ userId: user._id, displayName: user.fullName, city: user.city, province: user.province, country: user.country });
    } else if (input.role === "gallery") {
      await GalleryProfileModel.create({ userId: user._id, galleryName: user.fullName, city: user.city, province: user.province, country: user.country });
    }
    if (selection) {
      const { plan, cycle, price } = await getActivePlan(selection.planId, selection.billingCycle);
      await SubscriptionModel.create({
        userId: user._id,
        planId: plan.planId,
        billingCycle: cycle,
        status: "pending",
        price,
        commissionRate: plan.commissionRate,
        listingLimit: plan.listingLimit,
        currency: "PKR",
        featuresSnapshot: plan.permissions,
      });
      await ListingQuotaModel.updateOne({ userId: user._id }, { $setOnInsert: { activeListings: 0 } }, { upsert: true });
    }
    const code = await issueCode(user._id, "email_verification");
    await emailProvider().sendVerificationCode({ email: user.email, code, expiresInMinutes: 10 });
    await notify(user._id, "new_account", "Welcome to ArtDera", "Your account was created. Verify your email to continue.", "/artist/verify");
    await startSession(req, res, user._id);
    if (selectionToken)
      await PendingPlanSelectionModel.updateOne({ tokenHash: hashToken(selectionToken) }, { $set: { userId: user._id } });
    await audit(req, "user.registered", "User", user._id, undefined, { role: user.role, status: user.status });
    return ok(res, serializeUser(user), "Account created", 201);
  }),
);

authRouter.post(
  "/login",
  asyncRoute(async (req, res) => {
    const input = z.object({ email: z.string().email(), password: z.string().min(1).max(128) }).strict().parse(req.body);
    const user = await UserModel.findOne({ emailNormalized: normalizeEmail(input.email) }).select("+passwordHash +failedLoginAttempts +lockedUntil");
    const generic = new ApiError(401, "INVALID_CREDENTIALS", "The email or password is not correct");
    if (!user) {
      await bcrypt.compare(input.password, "$2b$12$tR6Yh6F4QX9pFqD.Mq65ZupjHng9bGnhV7M99S5FsUjA0WmZs7teS");
      throw generic;
    }
    if (["suspended", "deleted"].includes(user.status))
      throw new ApiError(403, "ACCOUNT_SUSPENDED", "This account is not available. Contact support.");
    if (user.lockedUntil && user.lockedUntil > new Date())
      throw new ApiError(423, "ACCOUNT_TEMPORARILY_LOCKED", "Too many attempts. Try again later or reset your password.");
    if (!(await bcrypt.compare(input.password, user.passwordHash))) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60_000);
        user.status = "locked";
      }
      await user.save();
      throw generic;
    }
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    if (user.status === "locked") user.status = user.emailVerified ? "active" : "pending_verification";
    user.lastLoginAt = new Date();
    await user.save();
    await startSession(req, res, user._id);
    await audit(req, "auth.login", "User", user._id);
    return ok(res, { user: serializeUser(user), destination: await destinationFor(user) });
  }),
);

authRouter.get(
  "/session",
  asyncRoute(async (req, res) => {
    if (!req.auth) return ok(res, { user: null, subscription: null });
    const subscription = await SubscriptionModel.findOne({ userId: req.auth.user._id }).sort({ createdAt: -1 }).lean();
    return ok(res, {
      user: serializeUser(req.auth.user),
      subscription: subscription ? serializeSubscription(subscription) : null,
      destination: await destinationFor(req.auth.user),
    });
  }),
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncRoute(async (req, res) => {
    await AuthSessionModel.updateOne({ _id: req.auth!.sessionId }, { $set: { revokedAt: new Date() } });
    res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined });
    return ok(res, { loggedOut: true });
  }),
);

authRouter.post(
  "/refresh",
  requireAuth,
  asyncRoute(async (req, res) => {
    await AuthSessionModel.updateOne({ _id: req.auth!.sessionId }, { $set: { revokedAt: new Date() } });
    await startSession(req, res, req.auth!.user._id);
    return ok(res, { user: serializeUser(req.auth!.user) });
  }),
);

authRouter.post(
  "/verify-email",
  requireAuth,
  asyncRoute(async (req, res) => {
    const { code } = z.object({ code: z.string().regex(/^\d{6}$/) }).strict().parse(req.body);
    await verifyCode(req.auth!.user._id, "email_verification", code);
    const user = req.auth!.user;
    user.emailVerified = true;
    user.status = "active";
    await user.save();
    const subscription = await SubscriptionModel.findOne({ userId: user._id }).sort({ createdAt: -1 });
    if (subscription?.planId === "free") {
      const now = new Date();
      subscription.status = "active";
      subscription.startedAt = now;
      subscription.currentPeriodStart = now;
      await subscription.save();
    }
    await notify(user._id, "account_verified", "Account verified", "Your email has been verified successfully.");
    await audit(req, "user.email_verified", "User", user._id);
    return ok(res, { verified: true, subscription: subscription ? serializeSubscription(subscription.toObject()) : null });
  }),
);

authRouter.post(
  "/verification/resend",
  requireAuth,
  asyncRoute(async (req, res) => {
    const code = await issueCode(req.auth!.user._id, "email_verification");
    await emailProvider().sendVerificationCode({ email: req.auth!.user.email, code, expiresInMinutes: 10 });
    return ok(res, { accepted: true }, "If delivery is configured, a new code has been sent");
  }),
);

authRouter.post(
  "/forgot-password",
  asyncRoute(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).strict().parse(req.body);
    const user = await UserModel.findOne({ emailNormalized: normalizeEmail(email), status: { $ne: "deleted" } });
    if (user) {
      const code = await issueCode(user._id, "password_reset");
      await emailProvider().sendPasswordReset({ email: user.email, code, expiresInMinutes: 10 });
    }
    return ok(res, { accepted: true }, "If the account exists, reset instructions will be sent");
  }),
);

authRouter.post(
  "/reset-password",
  asyncRoute(async (req, res) => {
    const input = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/), password: passwordSchema }).strict().parse(req.body);
    const user = await UserModel.findOne({ emailNormalized: normalizeEmail(input.email) }).select("+passwordHash");
    if (!user) throw new ApiError(422, "INVALID_OR_EXPIRED_CODE", "The code is invalid or has expired");
    await verifyCode(user._id, "password_reset", input.code);
    user.passwordHash = await bcrypt.hash(input.password, 12);
    user.passwordChangedAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    if (user.status === "locked") user.status = user.emailVerified ? "active" : "pending_verification";
    await user.save();
    await AuthSessionModel.updateMany({ userId: user._id, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
    return ok(res, { reset: true }, "Password updated");
  }),
);

authRouter.post(
  "/change-password",
  requireAuth,
  asyncRoute(async (req, res) => {
    const input = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema }).strict().parse(req.body);
    const user = await UserModel.findById(req.auth!.user._id).select("+passwordHash");
    if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash)))
      throw new ApiError(422, "CURRENT_PASSWORD_INCORRECT", "The current password is not correct");
    user.passwordHash = await bcrypt.hash(input.newPassword, 12);
    user.passwordChangedAt = new Date();
    await user.save();
    await AuthSessionModel.updateMany({ userId: user._id, _id: { $ne: req.auth!.sessionId } }, { $set: { revokedAt: new Date() } });
    return ok(res, { changed: true }, "Password changed");
  }),
);

authRouter.patch(
  "/contact",
  requireAuth,
  asyncRoute(async (req, res) => {
    const input = z.object({ email: z.string().email().optional(), phone: z.string().min(7).max(30).optional(), mobile: z.string().min(7).max(30).optional() }).strict().refine((v) => Boolean(v.email || v.phone || v.mobile)).parse(req.body);
    if (input.email) {
      const normalized = normalizeEmail(input.email);
      if (await UserModel.exists({ emailNormalized: normalized, _id: { $ne: req.auth!.user._id } }))
        throw new ApiError(409, "EMAIL_EXISTS", "An account already uses that email");
      req.auth!.user.email = normalized;
      req.auth!.user.emailNormalized = normalized;
      req.auth!.user.emailVerified = false;
      req.auth!.user.status = "pending_verification";
    }
    const phone = input.phone ?? input.mobile;
    if (phone) {
      const normalized = normalizePhone(phone);
      if (normalized && (await UserModel.exists({ phoneNormalized: normalized, _id: { $ne: req.auth!.user._id } })))
        throw new ApiError(409, "PHONE_EXISTS", "An account already uses that phone number");
      req.auth!.user.phone = phone;
      req.auth!.user.phoneNormalized = normalized;
      req.auth!.user.phoneVerified = false;
    }
    await req.auth!.user.save();
    return ok(res, serializeUser(req.auth!.user), "Contact details updated");
  }),
);
