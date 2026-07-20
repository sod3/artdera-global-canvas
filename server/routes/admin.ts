import { Router } from "express";
import { z } from "zod";
import {
  ArtistProfileModel,
  AnalyticsEventModel,
  ArtworkModel,
  AuditLogModel,
  CollectionModel,
  ConversationModel,
  ContentPageModel,
  CorporateLeadModel,
  DisputeModel,
  ExhibitionModel,
  GalleryProfileModel,
  InvoiceModel,
  MessageModel,
  NotificationModel,
  OrderModel,
  PaymentModel,
  PayoutModel,
  PromotionModel,
  ReviewModel,
  ShipmentModel,
  ShippingRuleModel,
  StoreModel,
  SubscriptionModel,
  SupportTicketModel,
  SystemSettingModel,
  TaxonomyModel,
  UserModel,
  VerificationRequestModel,
} from "../models";
import { ApiError, asyncRoute, limitQuery, ok, pageQuery } from "../lib/http";
import { requireRole } from "../middleware/auth";
import { publicArtwork, publicStore, serializeUser } from "../lib/serializers";
import { audit } from "../services/audit";
import { notify } from "../services/notifications";
import { releaseListingSlot } from "../services/plans";

export const adminRouter = Router();
adminRouter.use(requireRole("admin"));

adminRouter.get(
  "/dashboard",
  asyncRoute(async (_req, res) => {
    const [
      totalUsers,
      artists,
      galleries,
      buyers,
      stores,
      artworks,
      pendingModeration,
      orders,
      gmv,
      subscriptionRevenue,
      promotionRevenue,
      pendingPayouts,
      recentUsers,
      recentStores,
      recentArtworks,
      recentOrders,
      recentPromotions,
      auditLogs,
    ] = await Promise.all([
      UserModel.countDocuments({ status: { $ne: "deleted" } }),
      UserModel.countDocuments({ role: "artist", status: { $ne: "deleted" } }),
      UserModel.countDocuments({ role: "gallery", status: { $ne: "deleted" } }),
      UserModel.countDocuments({ role: "buyer", status: { $ne: "deleted" } }),
      StoreModel.countDocuments(),
      ArtworkModel.countDocuments(),
      ArtworkModel.countDocuments({ moderationStatus: "pending" }),
      OrderModel.countDocuments(),
      OrderModel.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$buyerTotal" }, commission: { $sum: "$platformCommission" }, refunds: { $sum: { $cond: [{ $eq: ["$status", "refunded"] }, "$buyerTotal", 0] } } } }]),
      PaymentModel.aggregate([{ $match: { paymentType: "subscription", status: "successful" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      PaymentModel.aggregate([{ $match: { paymentType: "promotion", status: "successful" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      PayoutModel.aggregate([{ $match: { status: { $in: ["pending", "available", "processing"] } } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$netAmount" } } }]),
      UserModel.find({ status: { $ne: "deleted" } }).sort({ createdAt: -1 }).limit(100),
      StoreModel.find().sort({ createdAt: -1 }).limit(100).lean(),
      ArtworkModel.find().sort({ createdAt: -1 }).limit(100).lean(),
      OrderModel.find().sort({ createdAt: -1 }).limit(100).lean(),
      PromotionModel.find().sort({ createdAt: -1 }).limit(100).lean(),
      AuditLogModel.find().sort({ createdAt: -1 }).limit(100).select("actorId actorRole action entityType entityId createdAt").lean(),
    ]);
    return ok(res, {
      metrics: {
        totalUsers,
        artists,
        galleries,
        buyers,
        stores,
        artworks,
        pendingModeration,
        orders,
        gmv: gmv[0]?.total ?? 0,
        commissionRevenue: gmv[0]?.commission ?? 0,
        refunds: gmv[0]?.refunds ?? 0,
        subscriptionRevenue: subscriptionRevenue[0]?.total ?? 0,
        promotionRevenue: promotionRevenue[0]?.total ?? 0,
        pendingPayouts: pendingPayouts[0]?.count ?? 0,
        pendingPayoutAmount: pendingPayouts[0]?.total ?? 0,
      },
      users: recentUsers.map(serializeUser),
      stores: recentStores.map(publicStore),
      artworks: recentArtworks.map(publicArtwork),
      orders: recentOrders.map(serializeAdminOrder),
      promotions: recentPromotions.map(serializeAdminPromotion),
      auditLogs: auditLogs.map((item) => ({ id: String(item._id), actorId: item.actorId ? String(item.actorId) : undefined, actorRole: item.actorRole, action: item.action, entityType: item.entityType, entityId: item.entityId ? String(item.entityId) : undefined, summary: `${item.action} · ${item.entityType}`, createdAt: item.createdAt.toISOString() })),
    });
  }),
);

adminRouter.patch(
  "/users/:id/status",
  asyncRoute(async (req, res) => {
    const { status } = z.object({ status: z.enum(["active", "suspended", "locked", "deleted"]) }).strict().parse(req.body);
    const before = await UserModel.findById(req.params.id).lean();
    if (!before) throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    if (String(before._id) === String(req.auth!.user._id) && status !== "active")
      throw new ApiError(409, "SELF_SUSPENSION_NOT_ALLOWED", "You cannot suspend your own admin account");
    const user = await UserModel.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    await audit(req, "admin.user_status_changed", "User", user!._id, { status: before.status }, { status });
    await notify(user!._id, "account_status", "Account status updated", `Your ArtDera account is now ${status}.`);
    return ok(res, serializeUser(user!), "User status updated");
  }),
);

adminRouter.patch(
  "/artworks/:id/moderation",
  asyncRoute(async (req, res) => {
    const input = z.object({ decision: z.enum(["approve", "reject"]), reason: z.string().trim().max(1000).optional() }).strict().refine((value) => value.decision !== "reject" || Boolean(value.reason), { message: "A rejection reason is required", path: ["reason"] }).parse(req.body);
    const artwork = await ArtworkModel.findById(req.params.id);
    if (!artwork) throw new ApiError(404, "ARTWORK_NOT_FOUND", "Artwork not found");
    const before = artwork.toObject();
    if (input.decision === "approve") {
      artwork.moderationStatus = "approved";
      artwork.status = "published";
      artwork.rejectionReason = undefined;
    } else {
      artwork.moderationStatus = "rejected";
      artwork.status = "rejected";
      artwork.rejectionReason = input.reason;
      const store = await StoreModel.findById(artwork.storeId).lean();
      if (store) await releaseListingSlot(store.ownerId);
    }
    await artwork.save();
    const store = await StoreModel.findById(artwork.storeId).lean();
    if (store) await notify(store.ownerId, input.decision === "approve" ? "artwork_approved" : "artwork_rejected", input.decision === "approve" ? "Artwork approved" : "Artwork needs changes", input.decision === "approve" ? `${artwork.title} is now live.` : input.reason!, "/artist/dashboard/artworks");
    await audit(req, `admin.artwork_${input.decision}d`, "Artwork", artwork._id, before, artwork.toObject());
    return ok(res, publicArtwork(artwork.toObject()), `Artwork ${input.decision}d`);
  }),
);

adminRouter.patch(
  "/verification/:id",
  asyncRoute(async (req, res) => {
    const input = z.object({ decision: z.enum(["approve", "reject", "request_changes", "remove"]), reason: z.string().trim().max(1200).optional(), adminNotes: z.string().trim().max(3000).optional() }).strict().parse(req.body);
    const request = await VerificationRequestModel.findById(req.params.id).select("+adminNotes");
    if (!request) throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Verification request not found");
    const status = input.decision === "approve" ? "approved" : input.decision === "request_changes" ? "changes_requested" : input.decision === "remove" ? "not_submitted" : "rejected";
    request.status = status;
    request.reviewedBy = req.auth!.user._id;
    request.reviewedAt = new Date();
    request.rejectionReason = input.reason;
    request.adminNotes = input.adminNotes;
    await request.save();
    const approved = status === "approved";
    await StoreModel.updateOne({ _id: request.storeId }, { $set: { verificationStatus: approved ? "approved" : status } });
    if (request.type === "gallery") await GalleryProfileModel.updateOne({ userId: request.userId }, { $set: { verificationStatus: approved ? "approved" : status } });
    else await ArtistProfileModel.updateOne({ userId: request.userId }, { $set: { verificationStatus: approved ? "approved" : status, verificationBadge: approved } });
    await notify(request.userId, approved ? "verification_approved" : "verification_updated", approved ? "Verification approved" : "Verification updated", approved ? "Your verified badge is now active." : input.reason ?? "Your verification request was updated.", "/artist/dashboard/verification");
    await audit(req, `admin.verification_${input.decision}`, "VerificationRequest", request._id, undefined, { status, reason: input.reason });
    return ok(res, { id: String(request._id), status }, "Verification updated");
  }),
);

adminRouter.patch(
  "/promotions/:id",
  asyncRoute(async (req, res) => {
    const input = z.object({ decision: z.enum(["approve", "reject", "cancel"]), reason: z.string().trim().max(1000).optional() }).strict().parse(req.body);
    const promotion = await PromotionModel.findById(req.params.id);
    if (!promotion) throw new ApiError(404, "PROMOTION_NOT_FOUND", "Promotion not found");
    if (input.decision === "approve") {
      const paid = await PaymentModel.exists({ _id: promotion.paymentId, status: "successful" });
      if (!paid) throw new ApiError(409, "PAYMENT_NOT_SUCCESSFUL", "Promotion payment has not succeeded");
      promotion.status = promotion.startAt && promotion.startAt > new Date() ? "scheduled" : "active";
      promotion.approvedBy = req.auth!.user._id;
      promotion.approvedAt = new Date();
      if (promotion.status === "active" && promotion.artworkId) await ArtworkModel.updateOne({ _id: promotion.artworkId }, { $set: { isSponsored: true, promotionId: promotion._id } });
    } else {
      promotion.status = input.decision === "reject" ? "rejected" : "cancelled";
      promotion.rejectionReason = input.reason;
      if (promotion.artworkId) await ArtworkModel.updateOne({ _id: promotion.artworkId }, { $set: { isSponsored: false }, $unset: { promotionId: 1 } });
    }
    await promotion.save();
    await notify(promotion.userId, `promotion_${promotion.status}`, `Promotion ${promotion.status}`, input.reason ?? `Your promotion is ${promotion.status}.`, "/artist/dashboard/promotions");
    await audit(req, `admin.promotion_${input.decision}d`, "Promotion", promotion._id);
    return ok(res, serializeAdminPromotion(promotion.toObject()), "Promotion updated");
  }),
);

adminRouter.patch(
  "/reviews/:id",
  asyncRoute(async (req, res) => {
    const { status } = z.object({ status: z.enum(["approved", "suspended", "rejected"]) }).strict().parse(req.body);
    const review = await ReviewModel.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true }).lean();
    if (!review) throw new ApiError(404, "REVIEW_NOT_FOUND", "Review not found");
    const rating = await ReviewModel.aggregate([{ $match: { storeId: review.storeId, status: "approved" } }, { $group: { _id: "$storeId", rating: { $avg: "$rating" }, count: { $sum: 1 } } }]);
    await StoreModel.updateOne({ _id: review.storeId }, { $set: { rating: rating[0]?.rating ?? 0, reviewCount: rating[0]?.count ?? 0 } });
    await audit(req, "admin.review_moderated", "Review", review._id, undefined, { status });
    return ok(res, { id: String(review._id), status }, "Review updated");
  }),
);

adminRouter.patch(
  "/payouts/:id",
  asyncRoute(async (req, res) => {
    const { status, providerReference } = z.object({ status: z.enum(["on_hold", "available", "processing", "completed", "failed", "reversed"]), providerReference: z.string().trim().max(200).optional() }).strict().parse(req.body);
    const payout = await PayoutModel.findByIdAndUpdate(req.params.id, { $set: { status, providerReference, ...(status === "completed" ? { processedAt: new Date() } : {}) } }, { new: true }).lean();
    if (!payout) throw new ApiError(404, "PAYOUT_NOT_FOUND", "Payout not found");
    await notify(payout.sellerId, status === "completed" ? "payout_completed" : "payout_updated", "Payout updated", `Your payout is now ${status}.`, "/artist/dashboard/payouts");
    await audit(req, "admin.payout_updated", "Payout", payout._id, undefined, { status, providerReference });
    return ok(res, { id: String(payout._id), status, providerReference }, "Payout updated");
  }),
);

adminRouter.post(
  "/shipping-rules",
  asyncRoute(async (req, res) => {
    const input = z.object({ name: z.string().trim().min(2).max(120), baseCost: z.number().nonnegative(), perKgCost: z.number().nonnegative().default(0), fragileSurcharge: z.number().nonnegative().default(0), framingSurcharge: z.number().nonnegative().default(0), city: z.string().trim().max(100).optional(), province: z.string().trim().max(100).optional(), isActive: z.boolean().default(true) }).strict().parse(req.body);
    const rule = await ShippingRuleModel.create(input);
    await audit(req, "admin.shipping_rule_created", "ShippingRule", rule._id);
    return ok(res, rule, "Shipping rule created", 201);
  }),
);

adminRouter.post(
  "/taxonomy",
  asyncRoute(async (req, res) => {
    const input = z.object({ type: z.enum(["category", "medium", "style", "city", "province"]), name: z.string().trim().min(1).max(100), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), province: z.string().trim().max(100).optional(), isActive: z.boolean().default(true), sortOrder: z.number().int().default(0) }).strict().parse(req.body);
    const item = await TaxonomyModel.create(input);
    await audit(req, "admin.taxonomy_created", "Taxonomy", item._id);
    return ok(res, item, "Taxonomy item created", 201);
  }),
);

adminRouter.post(
  "/collections",
  asyncRoute(async (req, res) => {
    const input = z.object({ name: z.string().trim().min(2).max(160), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().max(2000).default(""), artworkIds: z.array(z.string()).max(200).default([]), coverImageUrl: z.string().max(1000).optional(), isPublished: z.boolean().default(false), sortOrder: z.number().int().default(0) }).strict().parse(req.body);
    const item = await CollectionModel.create(input);
    await audit(req, "admin.collection_created", "Collection", item._id);
    return ok(res, item, "Collection created", 201);
  }),
);

adminRouter.patch(
  "/settings/:key",
  asyncRoute(async (req, res) => {
    const input = z.object({ value: z.unknown(), isPublic: z.boolean().default(false) }).strict().parse(req.body);
    const setting = await SystemSettingModel.findOneAndUpdate({ key: req.params.key }, { $set: { ...input, updatedBy: req.auth!.user._id } }, { new: true, upsert: true }).lean();
    await audit(req, "admin.setting_updated", "SystemSetting", setting!._id, undefined, { key: req.params.key });
    return ok(res, { key: setting!.key, value: setting!.value, isPublic: setting!.isPublic }, "Setting updated");
  }),
);

adminRouter.get(
  "/resources/:resource",
  asyncRoute(async (req, res) => {
    const page = pageQuery(req.query.page);
    const limit = limitQuery(req.query.limit, 25, 100);
    const search = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const resources: Record<string, { model: any; searchFields?: string[]; select?: string }> = {
      users: { model: UserModel, searchFields: ["fullName", "email"] },
      stores: { model: StoreModel, searchFields: ["name", "slug"] },
      artworks: { model: ArtworkModel, searchFields: ["title", "slug"] },
      verifications: { model: VerificationRequestModel },
      orders: { model: OrderModel, searchFields: ["orderNumber"] },
      payments: { model: PaymentModel, searchFields: ["providerReference"] },
      promotions: { model: PromotionModel },
      subscriptions: { model: SubscriptionModel },
      payouts: { model: PayoutModel },
      shipments: { model: ShipmentModel, searchFields: ["trackingNumber"] },
      reviews: { model: ReviewModel },
      disputes: { model: DisputeModel },
      categories: { model: TaxonomyModel },
      collections: { model: CollectionModel },
      exhibitions: { model: ExhibitionModel },
      leads: { model: CorporateLeadModel, searchFields: ["name", "company", "email"] },
      content: { model: ContentPageModel, searchFields: ["title", "slug"] },
      support: { model: SupportTicketModel, searchFields: ["ticketNumber", "subject"] },
      notifications: { model: NotificationModel, searchFields: ["title"] },
      invoices: { model: InvoiceModel, searchFields: ["invoiceNumber"] },
      audit: { model: AuditLogModel, searchFields: ["action", "entityType"], select: "actorId actorRole action entityType entityId createdAt" },
      shippingRules: { model: ShippingRuleModel },
      settings: { model: SystemSettingModel },
      conversations: { model: ConversationModel },
      messages: { model: MessageModel },
      analytics: { model: AnalyticsEventModel },
    };
    const resource = String(req.params.resource);
    const config = resources[resource];
    if (!config) throw new ApiError(404, "RESOURCE_NOT_FOUND", "Admin resource not found");
    const filter = search && config.searchFields ? { $or: config.searchFields.map((field: string) => ({ [field]: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } })) } : {};
    let query = config.model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    if (config.select) query = query.select(config.select);
    const [items, total] = await Promise.all([query, config.model.countDocuments(filter)]);
    const safeItems = resource === "users" ? items.map(serializeUser) : resource === "stores" ? items.map(publicStore) : resource === "artworks" ? items.map(publicArtwork) : items.map((item: any) => ({ ...item, id: String(item._id), _id: undefined, passwordHash: undefined, emailNormalized: undefined, phoneNormalized: undefined, submittedData: undefined, documentReferences: undefined, adminNotes: undefined, before: undefined, after: undefined }));
    return ok(res, { items: safeItems, page, limit, total, pages: Math.ceil(total / limit) });
  }),
);

function serializeAdminOrder(value: Record<string, any>) {
  return { id: String(value._id), orderNumber: value.orderNumber, buyerId: String(value.buyerId), sellerId: String(value.sellerId), storeId: String(value.storeId), status: String(value.status).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), paymentStatus: value.paymentStatus, subtotal: value.artworkSubtotal, shipping: value.shippingCost, commission: value.platformCommission, total: value.buyerTotal, createdAt: value.createdAt?.toISOString?.() ?? value.createdAt };
}

function serializeAdminPromotion(value: Record<string, any>) {
  return { id: String(value._id), userId: String(value.userId), storeId: String(value.storeId), artworkId: value.artworkId ? String(value.artworkId) : undefined, placementId: value.promotionType, status: String(value.status).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), startDate: value.startAt?.toISOString?.() ?? value.startAt, endDate: value.endAt?.toISOString?.() ?? value.endAt, price: value.price, impressions: value.impressions, clicks: value.clicks, saves: value.saves, messages: value.messages };
}
