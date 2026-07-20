import { randomUUID } from "node:crypto";
import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import {
  ArtworkModel,
  CartModel,
  FollowModel,
  InvoiceModel,
  OrderModel,
  PaymentModel,
  PayoutModel,
  ReviewModel,
  ShipmentModel,
  ShippingRuleModel,
  StoreModel,
  SubscriptionModel,
  WishlistItemModel,
} from "../models";
import { ApiError, asyncRoute, ok } from "../lib/http";
import { requireAuth, requireRole } from "../middleware/auth";
import { publicArtwork, publicStore } from "../lib/serializers";
import { paymentProvider } from "../services/payments";
import { getEnv } from "../config/env";
import { notify } from "../services/notifications";
import { audit } from "../services/audit";
import { releaseExpiredReservations } from "../services/reservations";

export const commerceRouter = Router();
type CartItemValue = { artworkId: mongoose.Types.ObjectId; quantity: number; priceSnapshot?: number };
const address = z.object({
  fullName: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(3).max(180),
  line2: z.string().trim().max(180).optional(),
  city: z.string().trim().min(2).max(100),
  province: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(24).optional(),
  country: z.string().trim().max(80).default("Pakistan"),
  phone: z.string().trim().min(7).max(30),
}).strict();

commerceRouter.get(
  "/cart",
  requireAuth,
  requireRole("buyer"),
  asyncRoute(async (req, res) => {
    await releaseExpiredReservations();
    const cart = await CartModel.findOne({ buyerId: req.auth!.user._id }).lean();
    if (!cart) return ok(res, { items: [], subtotal: 0 });
    const cartItems = cart.items as unknown as CartItemValue[];
    const artworks = await ArtworkModel.find({ _id: { $in: cartItems.map((item) => item.artworkId) } }).lean();
    const byId = new Map(artworks.map((item) => [String(item._id), item]));
    const items = cartItems
      .map((item) => {
        const artwork = byId.get(String(item.artworkId));
        return artwork ? { artwork: publicArtwork(artwork), quantity: item.quantity, priceChanged: item.priceSnapshot !== (artwork.discountPrice ?? artwork.price), available: artwork.status === "published" && artwork.quantity >= item.quantity } : null;
      })
      .filter(Boolean);
    const subtotal = items.reduce<number>((sum, item) => sum + ((item!.artwork.discountPrice ?? item!.artwork.price) * item!.quantity), 0);
    return ok(res, { items, subtotal });
  }),
);

commerceRouter.post(
  "/cart/items",
  requireAuth,
  requireRole("buyer"),
  asyncRoute(async (req, res) => {
    await releaseExpiredReservations();
    const input = z.object({ artworkId: z.string(), quantity: z.number().int().min(1).max(10).default(1) }).strict().parse(req.body);
    const artwork = await ArtworkModel.findOne({ _id: input.artworkId, status: "published", moderationStatus: "approved" });
    if (!artwork || artwork.quantity < input.quantity) throw new ApiError(409, "ARTWORK_UNAVAILABLE", "The artwork is no longer available");
    const store = await StoreModel.findById(artwork.storeId);
    if (!store) throw new ApiError(404, "STORE_NOT_FOUND", "Store not found");
    if (String(store.ownerId) === String(req.auth!.user._id)) throw new ApiError(422, "SELF_PURCHASE_NOT_ALLOWED", "You cannot buy your own artwork");
    const cart = await CartModel.findOneAndUpdate(
      { buyerId: req.auth!.user._id },
      {
        $pull: { items: { artworkId: artwork._id } },
        $setOnInsert: { buyerId: req.auth!.user._id },
      },
      { new: true, upsert: true },
    );
    cart.items.push({ artworkId: artwork._id, quantity: input.quantity, priceSnapshot: artwork.discountPrice ?? artwork.price });
    await cart.save();
    return ok(res, { artworkId: String(artwork._id), quantity: input.quantity }, "Added to cart", 201);
  }),
);

commerceRouter.delete(
  "/cart/items/:artworkId",
  requireAuth,
  requireRole("buyer"),
  asyncRoute(async (req, res) => {
    await CartModel.updateOne({ buyerId: req.auth!.user._id }, { $pull: { items: { artworkId: req.params.artworkId } } });
    return ok(res, { artworkId: req.params.artworkId }, "Removed from cart");
  }),
);

commerceRouter.post(
  "/checkout",
  requireAuth,
  requireRole("buyer"),
  asyncRoute(async (req, res) => {
    await releaseExpiredReservations();
    const input = z.object({ shippingAddress: address, billingAddress: address.optional(), method: z.enum(["card", "bank-transfer", "easypaisa", "jazzcash", "raast"]).default("card") }).strict().parse(req.body);
    const cart = await CartModel.findOne({ buyerId: req.auth!.user._id });
    if (!cart?.items.length) throw new ApiError(422, "CART_EMPTY", "Your cart is empty");
    const cartItems = cart.items as unknown as CartItemValue[];
    const artworks = await ArtworkModel.find({ _id: { $in: cartItems.map((item) => item.artworkId) } });
    if (artworks.length !== cartItems.length) throw new ApiError(409, "CART_STALE", "One or more cart items are no longer available");
    const stores = await StoreModel.find({ _id: { $in: artworks.map((artwork) => artwork.storeId) } });
    const storeById = new Map(stores.map((store) => [String(store._id), store]));
    const cartByArtwork = new Map<string, CartItemValue>(cartItems.map((item) => [String(item.artworkId), item]));
    for (const artwork of artworks) {
      const item = cartByArtwork.get(String(artwork._id))!;
      const store = storeById.get(String(artwork.storeId));
      if (!store || artwork.status !== "published" || artwork.quantity < item.quantity)
        throw new ApiError(409, "ARTWORK_UNAVAILABLE", `${artwork.title} is no longer available`);
      if (String(store.ownerId) === String(req.auth!.user._id))
        throw new ApiError(422, "SELF_PURCHASE_NOT_ALLOWED", "You cannot buy your own artwork");
      const currentPrice = artwork.discountPrice ?? artwork.price;
      if (currentPrice !== item.priceSnapshot)
        throw new ApiError(409, "PRICE_CHANGED", `${artwork.title} has a new price. Review your cart before paying.`);
    }
    const groups = new Map<string, typeof artworks>();
    for (const artwork of artworks) {
      const key = String(artwork.storeId);
      groups.set(key, [...(groups.get(key) ?? []), artwork]);
    }
    const prepared: Array<Record<string, any>> = [];
    for (const [storeId, group] of groups) {
      const store = storeById.get(storeId)!;
      const subscription = await SubscriptionModel.findOne({ userId: store.ownerId, status: "active" }).lean();
      if (!subscription) throw new ApiError(409, "SELLER_UNAVAILABLE", `${store.name} cannot accept orders right now`);
      const subtotal = group.reduce((sum, artwork) => sum + (artwork.discountPrice ?? artwork.price) * cartByArtwork.get(String(artwork._id))!.quantity, 0);
      const totalWeight = group.reduce((sum, artwork) => sum + Number(artwork.weight ?? 0), 0);
      const fragile = group.some((artwork) => artwork.isFragile);
      const framed = group.some((artwork) => artwork.isFramed);
      const rule = await ShippingRuleModel.findOne({ isActive: true, $or: [{ city: input.shippingAddress.city }, { province: input.shippingAddress.province }, { city: { $exists: false }, province: { $exists: false } }] }).sort({ city: -1, province: -1 }).lean();
      const shippingCost = Math.round((rule?.baseCost ?? 1500) + totalWeight * (rule?.perKgCost ?? 250) + (fragile ? rule?.fragileSurcharge ?? 500 : 0) + (framed ? rule?.framingSurcharge ?? 300 : 0));
      const paymentProcessingFee = Math.round(subtotal * 0.02);
      const platformCommission = Math.round(subtotal * (subscription.commissionRate / 100));
      const packagingCost = fragile ? 500 : 250;
      const buyerTotal = subtotal + shippingCost + packagingCost + paymentProcessingFee;
      const sellerNetAmount = Math.max(0, subtotal - platformCommission - paymentProcessingFee);
      const intent = await paymentProvider().createPayment({ amount: buyerTotal, currency: "PKR", idempotencyKey: `${req.auth!.user._id}_${storeId}_${randomUUID()}` });
      prepared.push({ store, subscription, group, subtotal, shippingCost, packagingCost, paymentProcessingFee, platformCommission, buyerTotal, sellerNetAmount, intent });
    }
    const dbSession = await mongoose.startSession();
    const results: Array<Record<string, unknown>> = [];
    try {
      await dbSession.withTransaction(async () => {
        for (const entry of prepared) {
          const orderNumber = `AD-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
          for (const artwork of entry.group) {
            const item = cartByArtwork.get(String(artwork._id))!;
            const reserved = await ArtworkModel.findOneAndUpdate(
              { _id: artwork._id, status: "published", quantity: { $gte: item.quantity } },
              { $set: { status: "reserved", reservedBy: req.auth!.user._id, reservedUntil: new Date(Date.now() + 20 * 60_000) } },
              { new: true, session: dbSession },
            );
            if (!reserved) throw new ApiError(409, "ARTWORK_UNAVAILABLE", `${artwork.title} was just reserved by another buyer`);
          }
          const [order] = await OrderModel.create(
            [{
              orderNumber,
              buyerId: req.auth!.user._id,
              sellerId: entry.store.ownerId,
              storeId: entry.store._id,
              items: entry.group.map((artwork: any) => ({ artworkId: artwork._id, title: artwork.title, image: artwork.images?.[0]?.url, price: artwork.discountPrice ?? artwork.price, quantity: cartByArtwork.get(String(artwork._id))!.quantity })),
              artworkSubtotal: entry.subtotal,
              discount: 0,
              shippingCost: entry.shippingCost,
              packagingCost: entry.packagingCost,
              handlingCost: 0,
              paymentProcessingFee: entry.paymentProcessingFee,
              platformCommission: entry.platformCommission,
              estimatedTax: 0,
              buyerTotal: entry.buyerTotal,
              sellerNetAmount: entry.sellerNetAmount,
              currency: "PKR",
              status: "awaiting_payment",
              paymentStatus: "pending",
              shippingAddress: input.shippingAddress,
              billingAddress: input.billingAddress ?? input.shippingAddress,
              buyerContactSnapshot: { fullName: req.auth!.user.fullName, email: req.auth!.user.email, phone: req.auth!.user.phone },
            }],
            { session: dbSession },
          );
          const [payment] = await PaymentModel.create(
            [{ userId: req.auth!.user._id, orderId: order._id, paymentType: "order", provider: getEnv().PAYMENT_PROVIDER, providerReference: entry.intent.reference, amount: entry.buyerTotal, currency: "PKR", status: "pending", metadata: { method: input.method } }],
            { session: dbSession },
          );
          const [invoice] = await InvoiceModel.create(
            [{ invoiceNumber: `INV-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`, userId: req.auth!.user._id, orderId: order._id, paymentId: payment._id, items: order.items.map((item: any) => ({ description: item.title, quantity: item.quantity, unitPrice: item.price, total: item.price * item.quantity })), subtotal: entry.subtotal, discount: 0, tax: 0, total: entry.buyerTotal, currency: "PKR", status: "issued", issuedAt: new Date() }],
            { session: dbSession },
          );
          const [shipment] = await ShipmentModel.create(
            [{ orderId: order._id, courier: "Estimate only", pickupCity: entry.group[0].pickupCity ?? entry.store.city, deliveryCity: input.shippingAddress.city, weight: entry.group.reduce((sum: number, artwork: any) => sum + Number(artwork.weight ?? 0), 0), fragile: entry.group.some((artwork: any) => artwork.isFragile), packagingType: "Art-safe estimate", estimatedCost: entry.shippingCost, status: "estimate" }],
            { session: dbSession },
          );
          results.push({ order: serializeOrder(order.toObject()), payment: serializePayment(payment.toObject()), invoiceId: String(invoice._id), shipmentId: String(shipment._id) });
        }
        await CartModel.deleteOne({ _id: cart._id }).session(dbSession);
      });
    } finally {
      await dbSession.endSession();
    }
    for (const entry of prepared) await notify(entry.store.ownerId, "order_placed", "New order awaiting payment", "A buyer started checkout for your artwork.", "/artist/dashboard/orders");
    await audit(req, "checkout.created", "Order", undefined, undefined, { orderIds: results.map((result: any) => result.order.id) });
    return ok(res, { orders: results, estimateNotice: "Shipping amounts are ArtDera estimates, not confirmed courier quotes." }, "Checkout created", 201);
  }),
);

commerceRouter.post(
  "/order-payments/:paymentId/confirm-demo",
  requireAuth,
  requireRole("buyer"),
  asyncRoute(async (req, res) => {
    if (!getEnv().DEMO_PAYMENT_MODE) throw new ApiError(404, "NOT_FOUND", "The requested resource was not found");
    const { outcome } = z.object({ outcome: z.enum(["success", "failure"]).default("success") }).strict().parse(req.body);
    const payment = await PaymentModel.findOne({ _id: req.params.paymentId, userId: req.auth!.user._id, paymentType: "order" });
    if (!payment) throw new ApiError(404, "PAYMENT_NOT_FOUND", "Payment not found");
    const order = await OrderModel.findById(payment.orderId);
    if (!order) throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
    if (payment.status === "successful") return ok(res, { payment: serializePayment(payment.toObject()), order: serializeOrder(order.toObject()) });
    const verified = await paymentProvider().verifyPayment(payment.providerReference, outcome);
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        if (!verified.successful) {
          payment.status = "failed";
          payment.failureReason = verified.failureReason;
          order.paymentStatus = "failed";
          order.status = "cancelled";
          order.cancelledAt = new Date();
          await ArtworkModel.updateMany({ _id: { $in: order.items.map((item: any) => item.artworkId) }, reservedBy: req.auth!.user._id }, { $set: { status: "published" }, $unset: { reservedBy: 1, reservedUntil: 1 } }, { session: dbSession });
        } else {
          payment.status = "successful";
          payment.paidAt = verified.paidAt ?? new Date();
          order.paymentStatus = "paid";
          order.status = "paid";
          for (const item of order.items) {
            await ArtworkModel.updateOne({ _id: item.artworkId, reservedBy: req.auth!.user._id }, { $set: { status: "sold" }, $inc: { soldCount: item.quantity, quantity: -item.quantity }, $unset: { reservedBy: 1, reservedUntil: 1 } }, { session: dbSession });
          }
          await InvoiceModel.updateOne({ paymentId: payment._id }, { $set: { status: "paid", paidAt: payment.paidAt } }, { session: dbSession });
        }
        await payment.save({ session: dbSession });
        await order.save({ session: dbSession });
      });
    } finally {
      await dbSession.endSession();
    }
    if (verified.successful) {
      await notify(order.buyerId, "payment_successful", "Payment successful", `Order ${order.orderNumber} is confirmed.`, "/account/orders");
      await notify(order.sellerId, "payment_successful", "Paid order received", `Order ${order.orderNumber} is ready for confirmation.`, "/artist/dashboard/orders");
    }
    await audit(req, verified.successful ? "order.payment_succeeded" : "order.payment_failed", "Order", order._id);
    return ok(res, { payment: serializePayment(payment.toObject()), order: serializeOrder(order.toObject()) }, verified.successful ? "Payment successful" : "Payment failed");
  }),
);

commerceRouter.get(
  "/orders",
  requireAuth,
  asyncRoute(async (req, res) => {
    const filter = req.auth!.user.role === "buyer" ? { buyerId: req.auth!.user._id } : req.auth!.user.role === "admin" ? {} : { sellerId: req.auth!.user._id };
    const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    return ok(res, orders.map(serializeOrder));
  }),
);

const transitions: Record<string, string[]> = {
  awaiting_payment: ["paid", "cancelled"],
  paid: ["seller_confirmed", "cancelled", "disputed"],
  seller_confirmed: ["preparing", "cancelled", "disputed"],
  preparing: ["ready_for_pickup", "cancelled", "disputed"],
  ready_for_pickup: ["shipped", "cancelled", "disputed"],
  shipped: ["out_for_delivery", "delivered", "disputed"],
  out_for_delivery: ["delivered", "disputed"],
  delivered: ["inspection_period", "return_requested", "disputed"],
  inspection_period: ["completed", "return_requested", "disputed"],
  return_requested: ["returned", "refunded", "disputed"],
  returned: ["refunded"],
};
const sellerTransitions = new Set(["seller_confirmed", "preparing", "ready_for_pickup", "shipped", "out_for_delivery", "delivered"]);
const buyerTransitions = new Set(["cancelled", "inspection_period", "completed", "return_requested", "disputed"]);

commerceRouter.patch(
  "/orders/:id/status",
  requireAuth,
  asyncRoute(async (req, res) => {
    const { status } = z.object({ status: z.enum(["paid", "seller_confirmed", "preparing", "ready_for_pickup", "shipped", "out_for_delivery", "delivered", "inspection_period", "completed", "return_requested", "returned", "refunded", "cancelled", "disputed"]) }).strict().parse(req.body);
    const order = await OrderModel.findById(req.params.id);
    if (!order) throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
    const isBuyer = String(order.buyerId) === String(req.auth!.user._id);
    const isSeller = String(order.sellerId) === String(req.auth!.user._id);
    const isAdmin = req.auth!.user.role === "admin";
    if (!isBuyer && !isSeller && !isAdmin) throw new ApiError(403, "FORBIDDEN", "You do not have access to this order");
    if (!transitions[order.status]?.includes(status)) throw new ApiError(409, "INVALID_ORDER_TRANSITION", `Order cannot move from ${order.status} to ${status}`);
    if (!isAdmin && sellerTransitions.has(status) && !isSeller) throw new ApiError(403, "SELLER_ONLY", "Only the seller can make this update");
    if (!isAdmin && buyerTransitions.has(status) && !isBuyer) throw new ApiError(403, "BUYER_ONLY", "Only the buyer can make this update");
    const before = order.status;
    order.status = status;
    if (status === "delivered") {
      order.inspectionEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60_000);
      await ShipmentModel.updateOne({ orderId: order._id }, { $set: { status: "delivered", deliveredAt: new Date() } });
    }
    if (status === "completed") {
      order.completedAt = new Date();
      const subscription = await SubscriptionModel.findOne({ userId: order.sellerId, status: "active" }).lean();
      const payoutDays = subscription?.planId === "free" ? 10 : subscription?.planId === "professional" ? 7 : 5;
      await PayoutModel.updateOne(
        { orderId: order._id },
        {
          $setOnInsert: {
            sellerId: order.sellerId,
            grossAmount: order.artworkSubtotal,
            commissionDeduction: order.platformCommission,
            paymentFeeDeduction: order.paymentProcessingFee,
            shippingDeduction: 0,
            taxDeduction: 0,
            refundAdjustment: 0,
            netAmount: order.sellerNetAmount,
            status: "pending",
            availableAt: new Date(Date.now() + payoutDays * 24 * 60 * 60_000),
          },
        },
        { upsert: true },
      );
      await notify(order.sellerId, "payout_available", "Payout scheduled", `Payout for ${order.orderNumber} has been scheduled.`, "/artist/dashboard/payouts");
    }
    await order.save();
    await notify(isBuyer ? order.sellerId : order.buyerId, `order_${status}`, "Order updated", `${order.orderNumber} is now ${status.replaceAll("_", " ")}.`, isBuyer ? "/artist/dashboard/orders" : "/account/orders");
    await audit(req, "order.status_changed", "Order", order._id, { status: before }, { status });
    return ok(res, serializeOrder(order.toObject()), "Order updated");
  }),
);

commerceRouter.get(
  "/shipping/:orderId",
  requireAuth,
  asyncRoute(async (req, res) => {
    const order = await OrderModel.findById(req.params.orderId).lean();
    if (!order || ![String(order.buyerId), String(order.sellerId)].includes(String(req.auth!.user._id)) && req.auth!.user.role !== "admin")
      throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
    const shipment = await ShipmentModel.findOne({ orderId: order._id }).lean();
    return ok(res, shipment ? serializeShipment(shipment) : null);
  }),
);

commerceRouter.patch(
  "/shipping/:orderId",
  requireAuth,
  asyncRoute(async (req, res) => {
    const input = z.object({ courier: z.string().trim().max(100).optional(), trackingNumber: z.string().trim().max(100).optional(), status: z.enum(["awaiting_pickup", "picked_up", "in_transit", "out_for_delivery", "delivered", "delayed", "damaged", "returned"]).optional(), actualCost: z.number().nonnegative().optional() }).strict().parse(req.body);
    const order = await OrderModel.findOne({ _id: req.params.orderId, sellerId: req.auth!.user._id });
    if (!order && req.auth!.user.role !== "admin") throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
    const shipment = await ShipmentModel.findOneAndUpdate({ orderId: req.params.orderId }, { $set: input, $push: input.status ? { trackingEvents: { status: input.status, description: `Status changed to ${input.status}`, occurredAt: new Date() } } : {} }, { new: true, runValidators: true }).lean();
    if (!shipment) throw new ApiError(404, "SHIPMENT_NOT_FOUND", "Shipment not found");
    return ok(res, serializeShipment(shipment), "Shipment updated");
  }),
);

commerceRouter.get(
  "/payouts",
  requireAuth,
  requireRole("artist", "gallery", "admin"),
  asyncRoute(async (req, res) => {
    const filter = req.auth!.user.role === "admin" ? {} : { sellerId: req.auth!.user._id };
    const payouts = await PayoutModel.find(filter).sort({ createdAt: -1 }).lean();
    return ok(res, payouts.map((value) => ({ id: String(value._id), sellerId: String(value.sellerId), orderId: String(value.orderId), gross: value.grossAmount, commission: value.commissionDeduction, shippingDeduction: value.shippingDeduction, taxEstimate: value.taxDeduction, processingDeduction: value.paymentFeeDeduction, refundAdjustment: value.refundAdjustment, net: value.netAmount, status: value.status === "completed" ? "Paid" : value.status === "available" ? "Available" : value.status === "on_hold" ? "On Hold" : "Pending", estimatedDate: value.availableAt?.toISOString() }))); 
  }),
);

commerceRouter.post(
  "/reviews",
  requireAuth,
  requireRole("buyer"),
  asyncRoute(async (req, res) => {
    const input = z.object({ orderId: z.string(), artworkId: z.string(), rating: z.number().int().min(1).max(5), title: z.string().trim().max(150).default(""), comment: z.string().trim().max(3000).default("") }).strict().parse(req.body);
    const order = await OrderModel.findOne({ _id: input.orderId, buyerId: req.auth!.user._id, status: "completed", "items.artworkId": input.artworkId });
    if (!order) throw new ApiError(403, "REVIEW_NOT_ELIGIBLE", "Only completed-order buyers can review this artwork");
    if (String(order.sellerId) === String(req.auth!.user._id)) throw new ApiError(422, "SELF_REVIEW_NOT_ALLOWED", "You cannot review yourself");
    if (await ReviewModel.exists({ orderId: order._id, artworkId: input.artworkId })) throw new ApiError(409, "REVIEW_EXISTS", "This order item has already been reviewed");
    const review = await ReviewModel.create({ orderId: order._id, buyerId: order.buyerId, sellerId: order.sellerId, storeId: order.storeId, artworkId: input.artworkId, rating: input.rating, title: input.title, comment: input.comment, status: "approved" });
    const rating = await ReviewModel.aggregate([{ $match: { storeId: order.storeId, status: "approved" } }, { $group: { _id: "$storeId", rating: { $avg: "$rating" }, count: { $sum: 1 } } }]);
    await StoreModel.updateOne({ _id: order.storeId }, { $set: { rating: rating[0]?.rating ?? 0, reviewCount: rating[0]?.count ?? 0 } });
    return ok(res, serializeReview(review.toObject()), "Review published", 201);
  }),
);

commerceRouter.patch(
  "/reviews/:id/respond",
  requireAuth,
  requireRole("artist", "gallery"),
  asyncRoute(async (req, res) => {
    const { response } = z.object({ response: z.string().trim().min(1).max(2000) }).strict().parse(req.body);
    const review = await ReviewModel.findOneAndUpdate({ _id: req.params.id, sellerId: req.auth!.user._id }, { $set: { sellerResponse: response } }, { new: true }).lean();
    if (!review) throw new ApiError(404, "REVIEW_NOT_FOUND", "Review not found");
    return ok(res, serializeReview(review), "Response saved");
  }),
);

commerceRouter.get(
  "/reviews/public/:storeId",
  asyncRoute(async (req, res) => {
    const reviews = await ReviewModel.find({ storeId: req.params.storeId, status: "approved" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return ok(res, reviews.map(serializeReview));
  }),
);

commerceRouter.get(
  "/reviews",
  requireAuth,
  asyncRoute(async (req, res) => {
    const filter = req.auth!.user.role === "buyer" ? { buyerId: req.auth!.user._id } : { sellerId: req.auth!.user._id };
    const reviews = await ReviewModel.find(filter).sort({ createdAt: -1 }).lean();
    return ok(res, reviews.map(serializeReview));
  }),
);

commerceRouter.get(
  "/wishlist",
  requireAuth,
  asyncRoute(async (req, res) => {
    const records = await WishlistItemModel.find({ userId: req.auth!.user._id }).sort({ createdAt: -1 }).lean();
    const artworks = await ArtworkModel.find({ _id: { $in: records.map((record) => record.artworkId) }, status: "published" }).lean();
    return ok(res, artworks.map(publicArtwork));
  }),
);

commerceRouter.post(
  "/wishlist/:artworkId",
  requireAuth,
  asyncRoute(async (req, res) => {
    const artwork = await ArtworkModel.findOne({ _id: req.params.artworkId, status: "published" });
    if (!artwork) throw new ApiError(404, "ARTWORK_NOT_FOUND", "Artwork not found");
    const result = await WishlistItemModel.updateOne({ userId: req.auth!.user._id, artworkId: artwork._id }, { $setOnInsert: { userId: req.auth!.user._id, artworkId: artwork._id } }, { upsert: true });
    if (result.upsertedCount) await ArtworkModel.updateOne({ _id: artwork._id }, { $inc: { wishlistCount: 1 } });
    return ok(res, { artworkId: String(artwork._id), saved: true }, "Saved to wishlist", 201);
  }),
);

commerceRouter.delete(
  "/wishlist/:artworkId",
  requireAuth,
  asyncRoute(async (req, res) => {
    const result = await WishlistItemModel.deleteOne({ userId: req.auth!.user._id, artworkId: req.params.artworkId });
    if (result.deletedCount) await ArtworkModel.updateOne({ _id: req.params.artworkId, wishlistCount: { $gt: 0 } }, { $inc: { wishlistCount: -1 } });
    return ok(res, { artworkId: req.params.artworkId, saved: false }, "Removed from wishlist");
  }),
);

commerceRouter.get(
  "/follows",
  requireAuth,
  asyncRoute(async (req, res) => {
    const follows = await FollowModel.find({ userId: req.auth!.user._id }).lean();
    const stores = await StoreModel.find({ _id: { $in: follows.map((follow) => follow.storeId) }, isPublished: true }).lean();
    return ok(res, stores.map(publicStore));
  }),
);

commerceRouter.post(
  "/follows/:storeId",
  requireAuth,
  asyncRoute(async (req, res) => {
    const store = await StoreModel.findOne({ _id: req.params.storeId, isPublished: true });
    if (!store) throw new ApiError(404, "STORE_NOT_FOUND", "Store not found");
    const result = await FollowModel.updateOne({ userId: req.auth!.user._id, storeId: store._id }, { $setOnInsert: { userId: req.auth!.user._id, storeId: store._id } }, { upsert: true });
    if (result.upsertedCount) await StoreModel.updateOne({ _id: store._id }, { $inc: { totalFollowers: 1 } });
    return ok(res, { storeId: String(store._id), following: true }, "Store followed", 201);
  }),
);

commerceRouter.delete(
  "/follows/:storeId",
  requireAuth,
  asyncRoute(async (req, res) => {
    const result = await FollowModel.deleteOne({ userId: req.auth!.user._id, storeId: req.params.storeId });
    if (result.deletedCount) await StoreModel.updateOne({ _id: req.params.storeId, totalFollowers: { $gt: 0 } }, { $inc: { totalFollowers: -1 } });
    return ok(res, { storeId: req.params.storeId, following: false }, "Store unfollowed");
  }),
);

function serializeOrder(value: Record<string, any>) {
  const labels: Record<string, string> = { awaiting_payment: "Awaiting Payment", paid: "Paid", seller_confirmed: "Seller Confirmed", preparing: "Preparing", ready_for_pickup: "Ready for Pickup", shipped: "Shipped", out_for_delivery: "Out for Delivery", delivered: "Delivered", inspection_period: "Inspection Period", completed: "Completed", return_requested: "Return Requested", returned: "Returned", refunded: "Refunded", cancelled: "Cancelled", disputed: "Disputed" };
  return { id: String(value._id), orderNumber: value.orderNumber, buyerId: String(value.buyerId), sellerId: String(value.sellerId), storeId: String(value.storeId), items: (value.items ?? []).map((item: any) => ({ id: String(item._id), artworkId: String(item.artworkId), title: item.title, price: item.price, quantity: item.quantity, image: item.image })), status: labels[value.status] ?? value.status, paymentStatus: value.paymentStatus, subtotal: value.artworkSubtotal, discount: value.discount, shipping: value.shippingCost, packaging: value.packagingCost, commission: value.platformCommission, total: value.buyerTotal, deliveryCity: value.shippingAddress?.city ?? "", createdAt: value.createdAt?.toISOString?.() ?? value.createdAt, inspectionEndsAt: value.inspectionEndsAt?.toISOString?.() ?? value.inspectionEndsAt };
}

function serializePayment(value: Record<string, any>) {
  return { id: String(value._id), userId: String(value.userId), orderId: value.orderId ? String(value.orderId) : undefined, amount: value.amount, status: value.status === "successful" ? "Succeeded" : value.status === "failed" ? "Failed" : "Pending Review", reference: value.providerReference, createdAt: value.createdAt?.toISOString?.() ?? value.createdAt, failureReason: value.failureReason };
}

function serializeShipment(value: Record<string, any>) {
  const labels: Record<string, string> = { estimate: "Packaging Required", awaiting_pickup: "Awaiting Pickup", picked_up: "Picked Up", in_transit: "In Transit", out_for_delivery: "In Transit", delivered: "Delivered", delayed: "Delayed", damaged: "Damaged", returned: "Returned" };
  return { id: String(value._id), orderId: String(value.orderId), status: labels[value.status] ?? value.status, courier: value.courier, trackingNumber: value.trackingNumber, pickupCity: value.pickupCity, deliveryCity: value.deliveryCity, estimatedCost: value.estimatedCost, actualCost: value.actualCost, estimateOnly: value.status === "estimate", trackingEvents: value.trackingEvents, updatedAt: value.updatedAt?.toISOString?.() ?? value.updatedAt };
}

function serializeReview(value: Record<string, any>) {
  return { id: String(value._id), orderId: String(value.orderId), artworkId: String(value.artworkId), buyerId: String(value.buyerId), sellerId: String(value.sellerId), rating: value.rating, title: value.title, body: value.comment, sellerResponse: value.sellerResponse, status: value.status === "approved" ? "Published" : value.status === "suspended" ? "Reported" : "Pending", createdAt: value.createdAt?.toISOString?.() ?? value.createdAt };
}
