import bcrypt from "bcryptjs";
import type { Express } from "express";
import request, { type Agent } from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import {
  ArtworkModel,
  AuthSessionModel,
  GalleryProfileModel,
  GalleryStaffModel,
  InvoiceModel,
  ListingQuotaModel,
  OrderModel,
  PayoutModel,
  ReviewModel,
  ShippingRuleModel,
  StoreModel,
  SubscriptionModel,
  SubscriptionPlanModel,
  UserModel,
} from "../server/models";
import { reserveListingSlot } from "../server/services/plans";
import { mergeSponsoredResults } from "../server/services/sponsored";

let app: Express;

beforeAll(async () => {
  const module = await import("../server/app");
  app = module.createApp();
});

const password = "ValidPass!123";

function registration(overrides: Record<string, unknown> = {}) {
  return {
    fullName: "Test Collector",
    email: `person-${Math.random().toString(36).slice(2)}@example.com`,
    phone: `+923${Math.floor(100000000 + Math.random() * 899999999)}`,
    password,
    role: "buyer",
    city: "Lahore",
    province: "Punjab",
    country: "Pakistan",
    termsAccepted: true,
    privacyAccepted: true,
    ...overrides,
  };
}

async function registerAndVerify(agent: Agent, overrides: Record<string, unknown> = {}) {
  const payload = registration(overrides);
  const registered = await agent.post("/api/auth/register").send(payload);
  expect(registered.status).toBe(201);
  const verified = await agent.post("/api/auth/verify-email").send({ code: "123456" });
  expect(verified.status).toBe(200);
  return { payload, user: registered.body.data };
}

async function directUser(
  role: "artist" | "buyer" | "gallery" | "gallery_staff" | "admin",
  email: string,
) {
  return UserModel.create({
    fullName: `${role} fixture`,
    email,
    emailNormalized: email,
    passwordHash: await bcrypt.hash(password, 4),
    role,
    sellerType: role === "artist" || role === "gallery" ? role : null,
    status: "active",
    emailVerified: true,
    city: "Lahore",
    province: "Punjab",
    country: "Pakistan",
    termsAcceptedAt: new Date(),
    privacyAcceptedAt: new Date(),
  });
}

async function login(email: string) {
  const agent = request.agent(app);
  const response = await agent.post("/api/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  return agent;
}

async function activeSubscription(
  userId: unknown,
  planId: "free" | "professional" | "pro-plus" | "gallery" = "free",
) {
  const plan = await SubscriptionPlanModel.findOne({ planId }).lean();
  return SubscriptionModel.create({
    userId,
    planId,
    billingCycle: planId === "free" ? "free" : "monthly",
    status: "active",
    price: plan!.monthlyPrice,
    commissionRate: plan!.commissionRate,
    listingLimit: plan!.listingLimit,
    currency: "PKR",
    startedAt: new Date(),
    currentPeriodStart: new Date(),
    featuresSnapshot: plan!.permissions,
  });
}

async function storeFor(owner: { _id: unknown; role: string }, slug: string) {
  return StoreModel.create({
    ownerId: owner._id,
    ownerType: owner.role,
    name: `${slug} studio`,
    slug,
    city: "Lahore",
    province: "Punjab",
    country: "Pakistan",
    status: "active",
    isPublished: true,
    verificationStatus: "approved",
  });
}

async function artworkFor(storeId: unknown, artistId: unknown, slug: string, status = "published") {
  return ArtworkModel.create({
    storeId,
    artistId,
    title: slug.replaceAll("-", " "),
    slug,
    description: "A database-backed test artwork.",
    category: "Abstract",
    medium: "Acrylic",
    style: "Modern",
    yearCreated: 2026,
    artworkType: "original",
    price: 100_000,
    currency: "PKR",
    width: 60,
    height: 80,
    weight: 2,
    weightUnit: "kg",
    orientation: "portrait",
    isFramed: true,
    isFragile: true,
    quantity: 1,
    images: [{ url: "/test-art.jpg", alt: "Test artwork", isPrimary: true }],
    pickupCity: "Lahore",
    domesticShipping: true,
    status,
    moderationStatus: status === "published" ? "approved" : "not_submitted",
  });
}

describe("authentication and sessions", () => {
  it("registers, verifies, persists a cookie session, and never returns a password hash", async () => {
    const agent = request.agent(app);
    const { payload, user } = await registerAndVerify(agent);
    expect(user).not.toHaveProperty("passwordHash");
    expect(user.email).toBe(String(payload.email).toLowerCase());
    const session = await agent.get("/api/auth/session");
    expect(session.body.data.user.emailVerified).toBe(true);
    expect(await AuthSessionModel.countDocuments()).toBe(1);
    const stored = await UserModel.findOne({ emailNormalized: payload.email }).select(
      "+passwordHash",
    );
    expect(stored!.passwordHash).not.toBe(password);
    expect(await bcrypt.compare(password, stored!.passwordHash)).toBe(true);
  });

  it("rejects duplicate accounts and incorrect passwords with safe errors", async () => {
    const agent = request.agent(app);
    const payload = registration({ email: "duplicate@example.com" });
    expect((await agent.post("/api/auth/register").send(payload)).status).toBe(201);
    const duplicate = await request(app)
      .post("/api/auth/register")
      .send({ ...payload, phone: "+923009999998" });
    expect(duplicate.status).toBe(409);
    const badLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: "WrongPass!123" });
    expect(badLogin.status).toBe(401);
    expect(JSON.stringify(badLogin.body)).not.toMatch(/mongo|stack|passwordHash/i);
  });

  it("supports forgot/reset password and revokes active sessions", async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndVerify(agent, { email: "reset@example.com" });
    expect(
      (await request(app).post("/api/auth/forgot-password").send({ email: payload.email })).status,
    ).toBe(200);
    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: payload.email, code: "123456", password: "NewValid!456" });
    expect(reset.status).toBe(200);
    expect((await agent.get("/api/auth/session")).body.data.user).toBeNull();
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .send({ email: payload.email, password: "NewValid!456" })
      ).status,
    ).toBe(200);
  });

  it("blocks suspended accounts", async () => {
    const user = await directUser("buyer", "suspended@example.com");
    user.status = "suspended";
    await user.save();
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ACCOUNT_SUSPENDED");
  });

  it("persists a clean notification-preference contract", async () => {
    const agent = request.agent(app);
    await registerAndVerify(agent, { email: "preferences@example.com" });
    const defaults = await agent.get("/api/notification-preferences");
    expect(defaults.status).toBe(200);
    expect(defaults.body.data).toEqual({
      email: true,
      inApp: true,
      marketing: false,
      orderUpdates: true,
      messageUpdates: true,
    });
    const updated = await agent
      .patch("/api/notification-preferences")
      .send({ marketing: true, email: false });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ marketing: true, email: false });
    expect(updated.body.data).not.toHaveProperty("_id");
    expect(updated.body.data).not.toHaveProperty("userId");
  });
});

describe("plans, payments, and listing limits", () => {
  it("activates Free only after verification and keeps a paid plan pending until payment succeeds", async () => {
    const freeAgent = request.agent(app);
    const free = registration({
      role: "artist",
      email: "free@example.com",
      planId: "free",
      billingCycle: "free",
    });
    expect((await freeAgent.post("/api/auth/register").send(free)).status).toBe(201);
    expect((await SubscriptionModel.findOne({ planId: "free" }))!.status).toBe("pending");
    await freeAgent.post("/api/auth/verify-email").send({ code: "123456" });
    expect((await SubscriptionModel.findOne({ planId: "free" }))!.status).toBe("active");

    const paidAgent = request.agent(app);
    const paid = registration({
      role: "artist",
      email: "paid@example.com",
      phone: "+923001111111",
      planId: "professional",
      billingCycle: "monthly",
    });
    await paidAgent.post("/api/auth/register").send(paid);
    await paidAgent.post("/api/auth/verify-email").send({ code: "123456" });
    expect((await SubscriptionModel.findOne({ planId: "professional" }))!.status).toBe("pending");
    const initiation = await paidAgent.post("/api/subscriptions/payment").send({ method: "card" });
    expect(initiation.status).toBe(201);
    expect((await SubscriptionModel.findOne({ planId: "professional" }))!.status).toBe("pending");
    const confirmation = await paidAgent
      .post(`/api/subscriptions/payment/${initiation.body.data.id}/confirm-demo`)
      .send({ outcome: "success" });
    expect(confirmation.status).toBe(200);
    expect((await SubscriptionModel.findOne({ planId: "professional" }))!.status).toBe("active");
    expect(await InvoiceModel.countDocuments({ userId: initiation.body.data.userId })).toBe(1);
  });

  it("calculates seller shipping estimates from an active database rule", async () => {
    const seller = await directUser("artist", "shipping-estimate@example.com");
    await activeSubscription(seller._id);
    await ShippingRuleModel.create({
      name: "Islamabad fixture",
      city: "Islamabad",
      baseCost: 1000,
      perKgCost: 200,
      fragileSurcharge: 300,
      framingSurcharge: 150,
      isActive: true,
    });
    const agent = await login(seller.email);
    const response = await agent.post("/api/shipping/estimate").send({
      city: "Islamabad",
      province: "Islamabad Capital Territory",
      weightKg: 3,
      fragile: true,
      framed: true,
      packagingType: "art_box",
    });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      courierCost: 2050,
      packagingCost: 500,
      total: 2550,
      ruleName: "Islamabad fixture",
      isCourierQuote: false,
    });
  });

  it("rejects invalid plans and billing cycles", async () => {
    expect(
      (
        await request(app)
          .post("/api/plans/select")
          .send({ planId: "enterprise", billingCycle: "monthly" })
      ).status,
    ).toBe(422);
    const invalidCycle = await request(app)
      .post("/api/plans/select")
      .send({ planId: "free", billingCycle: "monthly" });
    expect(invalidCycle.status).toBe(422);
    expect(invalidCycle.body.error.code).toBe("INVALID_BILLING_CYCLE");
  });

  it("allows five Free listings, blocks the sixth, and honors the Professional limit", async () => {
    const agent = request.agent(app);
    const { user } = await registerAndVerify(agent, {
      role: "artist",
      email: "limit@example.com",
      planId: "free",
      billingCycle: "free",
    });
    const createdStore = await agent
      .post("/api/stores")
      .send({ name: "Limit Studio", slug: "limit-studio", city: "Lahore", status: "active" });
    expect(createdStore.status).toBe(201);
    for (let index = 1; index <= 5; index += 1) {
      const response = await agent.post("/api/artworks").send({
        storeId: createdStore.body.data.id,
        title: `Free work ${index}`,
        description: "Original work",
        category: "Abstract",
        medium: "Acrylic",
        style: "Modern",
        subject: "Form",
        year: 2026,
        kind: "Original",
        price: 10_000 + index,
        dimensions: "20 x 30",
        weightKg: 1,
        framed: false,
        orientation: "Portrait",
        images: [],
        status: "Pending Review",
        quantity: 1,
        domesticShipping: true,
        internationalShipping: false,
        certificate: true,
        tags: [],
        customOrders: false,
      });
      expect(response.status).toBe(201);
    }
    const sixth = await agent.post("/api/artworks").send({
      storeId: createdStore.body.data.id,
      title: "Sixth work",
      description: "Original work",
      category: "Abstract",
      medium: "Acrylic",
      style: "Modern",
      subject: "Form",
      year: 2026,
      kind: "Original",
      price: 20_000,
      dimensions: "20 x 30",
      weightKg: 1,
      framed: false,
      orientation: "Portrait",
      images: [],
      status: "Pending Review",
      quantity: 1,
      domesticShipping: true,
      internationalShipping: false,
      certificate: true,
      tags: [],
      customOrders: false,
    });
    expect(sixth.status).toBe(409);
    expect(sixth.body.error.code).toBe("LISTING_LIMIT_REACHED");

    const professional = await SubscriptionPlanModel.findOne({ planId: "professional" }).lean();
    await SubscriptionModel.updateOne(
      { userId: user.id },
      {
        $set: {
          planId: "professional",
          listingLimit: 50,
          featuresSnapshot: professional!.permissions,
        },
      },
    );
    await ListingQuotaModel.updateOne({ userId: user.id }, { $set: { activeListings: 49 } });
    await expect(reserveListingSlot(user.id)).resolves.toBeTruthy();
    await expect(reserveListingSlot(user.id)).rejects.toMatchObject({
      code: "LISTING_LIMIT_REACHED",
    });
  });
});

describe("object authorization and gallery permissions", () => {
  it("prevents cross-seller edits, buyer payout reads, and seller admin access", async () => {
    const owner = await directUser("artist", "owner@example.com");
    const intruder = await directUser("artist", "intruder@example.com");
    const buyer = await directUser("buyer", "buyer-auth@example.com");
    await Promise.all([activeSubscription(owner._id), activeSubscription(intruder._id)]);
    const store = await storeFor(owner, "owner-studio");
    const artwork = await artworkFor(store._id, owner._id, "owner-work", "draft");
    const intruderAgent = await login(intruder.email);
    expect(
      (await intruderAgent.patch(`/api/artworks/${artwork._id}`).send({ title: "Stolen edit" }))
        .status,
    ).toBe(404);
    const buyerAgent = await login(buyer.email);
    expect((await buyerAgent.get("/api/payouts")).status).toBe(403);
    expect((await intruderAgent.get("/api/admin/dashboard")).status).toBe(403);
  });

  it("enforces assigned gallery staff permissions", async () => {
    const galleryOwner = await directUser("gallery", "gallery-owner@example.com");
    const staffUser = await directUser("gallery_staff", "gallery-staff@example.com");
    await activeSubscription(galleryOwner._id, "gallery");
    const profile = await GalleryProfileModel.create({
      userId: galleryOwner._id,
      galleryName: "Test Gallery",
      city: "Lahore",
      country: "Pakistan",
      onboardingCompleted: true,
    });
    await GalleryStaffModel.create({
      galleryId: profile._id,
      userId: staffUser._id,
      role: "Inventory",
      permissions: ["manage_inventory"],
      status: "active",
    });
    const agent = await login(staffUser.email);
    const denied = await agent.get("/api/gallery/artists");
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe("GALLERY_PERMISSION_REQUIRED");
  });
});

describe("orders, reviews, promotions, and security", () => {
  it("recalculates checkout totals, blocks invalid transitions, creates payout, and gates reviews", async () => {
    const seller = await directUser("artist", "order-seller@example.com");
    const buyer = await directUser("buyer", "order-buyer@example.com");
    await activeSubscription(seller._id, "free");
    const store = await storeFor(seller, "order-studio");
    const artwork = await artworkFor(store._id, seller._id, "order-work");
    const buyerAgent = await login(buyer.email);
    expect(
      (
        await buyerAgent
          .post("/api/cart/items")
          .send({ artworkId: String(artwork._id), quantity: 1 })
      ).status,
    ).toBe(201);
    const checkout = await buyerAgent.post("/api/checkout").send({
      shippingAddress: {
        fullName: "Order Buyer",
        line1: "Street 1",
        city: "Lahore",
        province: "Punjab",
        country: "Pakistan",
        phone: "+923001234567",
      },
      method: "card",
    });
    expect(checkout.status).toBe(201);
    const created = checkout.body.data.orders[0];
    expect(created.order.subtotal).toBe(100_000);
    expect(created.order.total).toBe(105_300);
    await buyerAgent
      .post(`/api/order-payments/${created.payment.id}/confirm-demo`)
      .send({ outcome: "success" });
    expect((await ArtworkModel.findById(artwork._id))!.status).toBe("sold");
    const invalid = await buyerAgent
      .patch(`/api/orders/${created.order.id}/status`)
      .send({ status: "completed" });
    expect(invalid.status).toBe(409);
    const earlyReview = await buyerAgent.post("/api/reviews").send({
      orderId: created.order.id,
      artworkId: String(artwork._id),
      rating: 5,
      title: "Too early",
      comment: "Not completed",
    });
    expect(earlyReview.status).toBe(403);
    await OrderModel.updateOne(
      { _id: created.order.id },
      { $set: { status: "inspection_period" } },
    );
    expect(
      (
        await buyerAgent
          .patch(`/api/orders/${created.order.id}/status`)
          .send({ status: "completed" })
      ).status,
    ).toBe(200);
    expect(await PayoutModel.countDocuments({ orderId: created.order.id })).toBe(1);
    expect(
      (
        await buyerAgent.post("/api/reviews").send({
          orderId: created.order.id,
          artworkId: String(artwork._id),
          rating: 5,
          title: "Collected",
          comment: "Arrived safely",
        })
      ).status,
    ).toBe(201);
    expect(await ReviewModel.countDocuments({ orderId: created.order.id })).toBe(1);
  });

  it("rejects sold artworks and keeps sponsored interleaving at or below twenty percent", async () => {
    const seller = await directUser("artist", "sold-seller@example.com");
    const buyer = await directUser("buyer", "sold-buyer@example.com");
    await activeSubscription(seller._id);
    const store = await storeFor(seller, "sold-studio");
    const sold = await artworkFor(store._id, seller._id, "sold-work", "sold");
    const agent = await login(buyer.email);
    expect(
      (await agent.post("/api/cart/items").send({ artworkId: String(sold._id), quantity: 1 }))
        .status,
    ).toBe(409);
    const organic = Array.from({ length: 20 }, (_, id) => ({ id: `o${id}` }));
    const sponsored = Array.from({ length: 20 }, (_, id) => ({ id: `s${id}` }));
    const merged = mergeSponsoredResults(organic, sponsored, 20);
    expect(merged).toHaveLength(20);
    expect(merged.filter((item) => item.id.startsWith("s")).length).toBeLessThanOrEqual(4);
  });

  it("rejects NoSQL operators and invalid object IDs without exposing internals", async () => {
    const injection = await request(app)
      .post("/api/auth/login")
      .send({ email: { $ne: null }, password: "anything" });
    expect(injection.status).toBe(422);
    expect(injection.body.error.code).toBe("INVALID_PAYLOAD");
    const user = await directUser("artist", "invalid-id@example.com");
    await activeSubscription(user._id);
    const agent = await login(user.email);
    const invalidId = await agent
      .patch("/api/artworks/not-a-valid-object-id")
      .send({ title: "No" });
    expect(invalidId.status).toBe(422);
    expect(JSON.stringify(invalidId.body)).not.toMatch(/mongoose|mongodb|stack|server\\/i);
  });

  it("rate limits repeated authentication abuse", async () => {
    const isolated = (await import("../server/app")).createApp();
    let response: request.Response | undefined;
    for (let index = 0; index < 21; index += 1) {
      response = await request(isolated)
        .post("/api/auth/login")
        .send({ email: "invalid", password: "x" });
    }
    expect(response!.status).toBe(429);
    expect(response!.body.error.code).toBe("RATE_LIMITED");
  });
});
