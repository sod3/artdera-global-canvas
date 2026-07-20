import { Router } from "express";
import { z } from "zod";
import {
  ArtistProfileModel,
  ArtworkModel,
  GalleryProfileModel,
  OnboardingDraftModel,
  StoreModel,
  SubscriptionModel,
  VerificationRequestModel,
} from "../models";
import { ApiError, asyncRoute, ok } from "../lib/http";
import { requireAuth, requireRole, requireVerified } from "../middleware/auth";
import { publicArtwork, publicStore } from "../lib/serializers";
import { audit } from "../services/audit";
import { notify } from "../services/notifications";
import { sanitizeText } from "../lib/security";
import { requirePermission, reserveListingSlot } from "../services/plans";

export const storesRouter = Router();
const reservedSlugs = new Set(["admin", "api", "artdera", "auth", "dashboard", "discover", "help", "new-store", "sell", "store", "stores", "support"]);
const slugSchema = z.string().trim().toLowerCase().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const storeInput = z
  .object({
    name: z.string().trim().min(2).max(160),
    slug: slugSchema,
    tagline: z.string().trim().max(180).default(""),
    shortDescription: z.string().trim().max(400).default(""),
    fullDescription: z.string().trim().max(5000).default(""),
    bio: z.string().trim().max(400).optional(),
    story: z.string().trim().max(5000).optional(),
    logoUrl: z.string().max(1000).optional(),
    coverImageUrl: z.string().max(1000).optional(),
    profileImage: z.string().max(1000).optional(),
    coverImage: z.string().max(1000).optional(),
    city: z.string().trim().max(100).optional(),
    province: z.string().trim().max(100).optional(),
    country: z.string().trim().max(80).default("Pakistan"),
    categories: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    styles: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    mediums: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    themes: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    domesticShipping: z.boolean().default(true),
    internationalShipping: z.boolean().default(false),
    processingTime: z.string().trim().max(80).default("3-5 working days"),
    publicContactPreference: z.enum(["messages", "eligible_orders"]).default("messages"),
    customCommissionAvailable: z.boolean().default(false),
    status: z.enum(["draft", "pending_review", "active"]).default("draft"),
  })
  .strict();

storesRouter.get(
  "/mine",
  requireAuth,
  asyncRoute(async (req, res) => {
    const stores = await StoreModel.find({ ownerId: req.auth!.user._id }).sort({ createdAt: -1 }).lean();
    return ok(res, stores.map(publicStore));
  }),
);

storesRouter.get(
  "/slug-available/:slug",
  asyncRoute(async (req, res) => {
    const slug = slugSchema.parse(req.params.slug);
    const available = !reservedSlugs.has(slug) && !(await StoreModel.exists({ slug }));
    return ok(res, { slug, available });
  }),
);

storesRouter.get(
  "/:slug",
  asyncRoute(async (req, res) => {
    const slug = slugSchema.parse(req.params.slug);
    const store = await StoreModel.findOne({ slug, isPublished: true, status: "active" }).lean();
    if (!store) throw new ApiError(404, "STORE_NOT_FOUND", "Store not found");
    const artworks = await ArtworkModel.find({ storeId: store._id, status: "published", moderationStatus: "approved" })
      .sort({ isSponsored: -1, createdAt: -1 })
      .limit(100)
      .lean();
    void StoreModel.updateOne({ _id: store._id }, { $inc: { totalViews: 1 } });
    return ok(res, { store: publicStore(store), artworks: artworks.map(publicArtwork) });
  }),
);

storesRouter.post(
  "/",
  requireVerified,
  requireRole("artist", "gallery"),
  asyncRoute(async (req, res) => {
    const input = storeInput.parse(req.body);
    if (reservedSlugs.has(input.slug)) throw new ApiError(409, "SLUG_RESERVED", "That store URL is reserved");
    if (await StoreModel.exists({ slug: input.slug })) throw new ApiError(409, "SLUG_TAKEN", "That store URL is already in use");
    const subscription = await SubscriptionModel.findOne({ userId: req.auth!.user._id, status: "active" });
    if (!subscription) throw new ApiError(403, "ACTIVE_SUBSCRIPTION_REQUIRED", "Activate your subscription before creating a store");
    if (input.internationalShipping) await requirePermission(req.auth!.user._id, "international-tools");
    const store = await StoreModel.create({
      ownerId: req.auth!.user._id,
      ownerType: req.auth!.user.role,
      name: sanitizeText(input.name, 160),
      slug: input.slug,
      tagline: sanitizeText(input.tagline, 180),
      shortDescription: sanitizeText(input.shortDescription ?? input.bio ?? "", 400),
      fullDescription: sanitizeText(input.fullDescription ?? input.story ?? "", 5000),
      logoUrl: input.logoUrl ?? input.profileImage,
      coverImageUrl: input.coverImageUrl ?? input.coverImage,
      city: input.city ?? req.auth!.user.city,
      province: input.province ?? req.auth!.user.province,
      country: input.country,
      categories: input.categories,
      styles: input.styles,
      mediums: input.mediums,
      themes: input.themes,
      status: input.status,
      isPublished: input.status === "active",
      domesticShipping: input.domesticShipping,
      internationalShipping: input.internationalShipping,
      processingTime: input.processingTime,
      publicContactPreference: input.publicContactPreference,
      customCommissionAvailable: input.customCommissionAvailable,
    });
    subscription.storeId = store._id;
    await subscription.save();
    await notify(req.auth!.user._id, "store_created", "Store created", `${store.name} is ready for setup.`, `/store/${store.slug}`);
    await audit(req, "store.created", "Store", store._id, undefined, store.toObject());
    return ok(res, publicStore(store.toObject()), "Store created", 201);
  }),
);

storesRouter.patch(
  "/:id",
  requireAuth,
  requireRole("artist", "gallery"),
  asyncRoute(async (req, res) => {
    const input = storeInput.partial().parse(req.body);
    if (input.slug && reservedSlugs.has(input.slug)) throw new ApiError(409, "SLUG_RESERVED", "That store URL is reserved");
    if (input.slug && (await StoreModel.exists({ slug: input.slug, _id: { $ne: req.params.id } })))
      throw new ApiError(409, "SLUG_TAKEN", "That store URL is already in use");
    const before = await StoreModel.findOne({ _id: req.params.id, ownerId: req.auth!.user._id }).lean();
    if (!before) throw new ApiError(404, "STORE_NOT_FOUND", "Store not found");
    if (input.internationalShipping) await requirePermission(req.auth!.user._id, "international-tools");
    const patch: Record<string, unknown> = { ...input };
    if (input.bio !== undefined) patch.shortDescription = input.bio;
    if (input.story !== undefined) patch.fullDescription = input.story;
    if (input.profileImage !== undefined) patch.logoUrl = input.profileImage;
    if (input.coverImage !== undefined) patch.coverImageUrl = input.coverImage;
    delete patch.bio;
    delete patch.story;
    delete patch.profileImage;
    delete patch.coverImage;
    if (input.status) patch.isPublished = input.status === "active";
    const store = await StoreModel.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.auth!.user._id },
      { $set: patch },
      { new: true, runValidators: true },
    ).lean();
    await audit(req, "store.updated", "Store", before._id, before, store);
    return ok(res, publicStore(store!), "Store updated");
  }),
);

storesRouter.get(
  "/onboarding/draft/current",
  requireAuth,
  asyncRoute(async (req, res) => {
    const draft = await OnboardingDraftModel.findOne({ userId: req.auth!.user._id }).lean();
    return ok(res, draft ? { step: draft.step, data: draft.data, completedAt: draft.completedAt } : { step: 0, data: {} });
  }),
);

storesRouter.patch(
  "/onboarding/draft/current",
  requireAuth,
  requireRole("artist", "gallery"),
  asyncRoute(async (req, res) => {
    const input = z.object({ step: z.number().int().min(0).max(7), data: z.record(z.unknown()) }).strict().parse(req.body);
    const draft = await OnboardingDraftModel.findOneAndUpdate(
      { userId: req.auth!.user._id },
      { $set: { step: input.step, data: input.data } },
      { new: true, upsert: true, runValidators: true },
    ).lean();
    const Profile = req.auth!.user.role === "gallery" ? GalleryProfileModel : ArtistProfileModel;
    await Profile.updateOne({ userId: req.auth!.user._id }, { $set: { onboardingStep: input.step } });
    return ok(res, { step: draft!.step, data: draft!.data }, "Onboarding draft saved");
  }),
);

storesRouter.post(
  "/onboarding/complete",
  requireVerified,
  requireRole("artist", "gallery"),
  asyncRoute(async (req, res) => {
    const input = z.object({ data: z.record(z.unknown()) }).strict().parse(req.body);
    const data = input.data as Record<string, any>;
    const required = ["displayName", "storeName", "slug", "shortBio", "city"];
    if (required.some((field) => typeof data[field] !== "string" || !data[field].trim()))
      throw new ApiError(422, "ONBOARDING_INCOMPLETE", "Complete all required store details before publishing");
    const slug = slugSchema.parse(data.slug);
    if (reservedSlugs.has(slug)) throw new ApiError(409, "SLUG_RESERVED", "That store URL is reserved");
    const existing = await StoreModel.findOne({ ownerId: req.auth!.user._id });
    if (!existing && (await StoreModel.exists({ slug }))) throw new ApiError(409, "SLUG_TAKEN", "That store URL is already in use");
    const subscription = await SubscriptionModel.findOne({ userId: req.auth!.user._id, status: "active" });
    if (!subscription) throw new ApiError(403, "ACTIVE_SUBSCRIPTION_REQUIRED", "Activate your subscription before publishing a store");
    if (data.internationalInterest) await requirePermission(req.auth!.user._id, "international-tools");
    const list = (value: unknown) =>
      typeof value === "string" ? value.split(",").map((item) => sanitizeText(item, 80)).filter(Boolean).slice(0, 30) : [];
    const store = await StoreModel.findOneAndUpdate(
      { ownerId: req.auth!.user._id },
      {
        $set: {
          ownerType: req.auth!.user.role,
          name: sanitizeText(data.storeName, 160),
          slug,
          tagline: sanitizeText(data.tagline ?? "", 180),
          shortDescription: sanitizeText(data.shortBio, 400),
          fullDescription: sanitizeText(data.story ?? data.about ?? "", 5000),
          logoUrl: data.profileImage,
          coverImageUrl: data.coverImage,
          city: sanitizeText(data.city, 100),
          province: sanitizeText(data.province ?? "", 100),
          country: sanitizeText(data.country ?? "Pakistan", 80),
          categories: list(data.categories),
          styles: list(data.styles),
          mediums: list(data.mediums),
          themes: list(data.themes),
          status: "active",
          isPublished: true,
          domesticShipping: Boolean(data.domesticShipping),
          internationalShipping: Boolean(data.internationalInterest),
          processingTime: sanitizeText(data.processingTime ?? "3-5 working days", 80),
          publicContactPreference: "messages",
          customCommissionAvailable: Boolean(data.commissions),
        },
        $setOnInsert: { ownerId: req.auth!.user._id },
      },
      { new: true, upsert: true, runValidators: true },
    );
    subscription.storeId = store._id;
    await subscription.save();
    const Profile = req.auth!.user.role === "gallery" ? GalleryProfileModel : ArtistProfileModel;
    await Profile.updateOne(
      { userId: req.auth!.user._id },
      {
        $set: {
          onboardingCompleted: true,
          onboardingStep: 7,
          ...(req.auth!.user.role === "artist"
            ? {
                displayName: sanitizeText(data.displayName, 120),
                professionalTitle: sanitizeText(data.professionalTitle ?? "", 120),
                shortBio: sanitizeText(data.shortBio, 300),
                fullBio: sanitizeText(data.story ?? "", 5000),
                profileImageUrl: data.profileImage,
                coverImageUrl: data.coverImage,
                city: sanitizeText(data.city, 100),
                province: sanitizeText(data.province ?? "", 100),
                country: sanitizeText(data.country ?? "Pakistan", 80),
                languages: list(data.languages),
                categories: list(data.categories),
                styles: list(data.styles),
                mediums: list(data.mediums),
                themes: list(data.themes),
                portfolioUrl: data.portfolio,
                socialLinks: { instagram: data.instagram },
                customCommissionsAvailable: Boolean(data.commissions),
              }
            : {}),
        },
      },
    );
    let artwork;
    if (data.addArtwork && data.artworkTitle) {
      const publishNow = !data.artworkDraft;
      if (publishNow) await reserveListingSlot(req.auth!.user._id);
      artwork = await ArtworkModel.create({
        storeId: store._id,
        artistId: req.auth!.user.role === "artist" ? req.auth!.user._id : undefined,
        title: sanitizeText(data.artworkTitle, 180),
        slug: `${String(data.artworkTitle).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80)}-${Date.now().toString(36)}`,
        description: sanitizeText(data.artworkDescription ?? "", 8000),
        category: sanitizeText(data.artworkCategory ?? "Original Works", 80),
        medium: sanitizeText(data.artworkMedium ?? "Mixed media", 80),
        style: sanitizeText(data.artworkStyle ?? "Contemporary", 80),
        subject: sanitizeText(data.artworkSubject ?? "", 100),
        yearCreated: Number(data.artworkYear) || new Date().getFullYear(),
        artworkType: data.artworkKind === "Print" ? "print" : data.artworkKind === "Limited Edition" ? "limited_edition" : "original",
        price: Number(data.artworkPrice),
        discountPrice: data.artworkDiscount ? Number(data.artworkDiscount) : undefined,
        width: Number(data.width) || undefined,
        height: Number(data.height) || undefined,
        depth: Number(data.depth) || undefined,
        measurementUnit: data.unit === "in" ? "in" : "cm",
        weight: Number(data.weight) || undefined,
        orientation: String(data.orientation ?? "Portrait").toLowerCase(),
        isFramed: Boolean(data.framed),
        quantity: Number(data.quantity) || 1,
        images: data.artworkImage ? [{ url: data.artworkImage, alt: sanitizeText(data.artworkTitle, 180), isPrimary: true }] : [],
        certificateAvailable: Boolean(data.certificate),
        pickupCity: sanitizeText(data.pickupCity ?? data.city, 100),
        domesticShipping: Boolean(data.domesticShipping),
        internationalShipping: Boolean(data.internationalInterest),
        processingTime: sanitizeText(data.processingTime ?? "3-5 working days", 80),
        tags: list(data.tags),
        customOrders: Boolean(data.customOrders),
        status: publishNow ? "pending_review" : "draft",
        moderationStatus: publishNow ? "pending" : "not_submitted",
      });
      if (publishNow) await notify(req.auth!.user._id, "artwork_submitted", "Artwork submitted", `${artwork.title} is awaiting moderation.`, "/artist/dashboard/artworks");
    }
    if (data.verificationSubmitted) {
      await VerificationRequestModel.updateOne(
        { userId: req.auth!.user._id, type: req.auth!.user.role },
        { $set: { storeId: store._id, submittedData: { ownershipDeclared: Boolean(data.ownershipDeclared) }, status: "pending" } },
        { upsert: true },
      );
    }
    await OnboardingDraftModel.updateOne(
      { userId: req.auth!.user._id },
      { $set: { step: 7, data, completedAt: new Date() } },
      { upsert: true },
    );
    await notify(req.auth!.user._id, "store_created", "Store published", `${store.name} is now live.`, `/store/${store.slug}`);
    await audit(req, "onboarding.completed", "Store", store._id, undefined, { storeId: store._id, artworkId: artwork?._id });
    return ok(res, { store: publicStore(store.toObject()), artwork: artwork ? publicArtwork(artwork.toObject()) : null }, "Onboarding completed", 201);
  }),
);
