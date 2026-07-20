import { PLAN_RANK, hydrateSubscriptionPlans, isPlanId, planPrice, validBillingCycle } from "@/config/subscription-plans";
import {
  COLLECTIONS,
  CREATORS,
  CATEGORIES,
  IMAGES,
  PRODUCTS,
  hydrateEditorialData,
  type Category as EditorialCategory,
  type Creator as EditorialCreator,
  type EditorialCollection,
  type Product,
} from "@/lib/artdera";
import {
  ADMIN_METRICS,
  ANALYTICS,
  ARTWORKS,
  AUDIT_LOG,
  CONVERSATIONS,
  CUSTOMERS,
  EXHIBITIONS,
  MESSAGES,
  NOTIFICATIONS,
  ORDERS,
  PAYOUTS,
  PROMOTIONS,
  REVIEWS,
  SEEDED_USERS,
  SHIPMENTS,
  STAFF,
  STORES,
  VERIFICATIONS,
  hydrateAdminMetrics,
  hydrateMarketplaceData,
} from "./data";
import { DEMO_PAYMENT_MODE, PLANS, ROLE_HOME, hydrateRuntimeConfig } from "./config";
import type {
  Artwork,
  ArtistFlowState,
  BillingCycle,
  Conversation,
  Invoice,
  Message,
  Notification,
  Payment,
  PaymentMethod,
  PlanDowngrade,
  PlanId,
  PlanSelection,
  PlanUpgrade,
  PlanUsage,
  Promotion,
  ServiceResult,
  Store,
  Subscription,
  SubscriptionPlan,
  User,
  UserRole,
} from "./types";

type ApiEnvelope<T> = { success: true; data: T; message?: string };
type ApiFailure = { success: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

export class HttpApiClient {
  private readonly base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

  async request<T>(method: string, path: string, payload?: unknown): Promise<ServiceResult<T>> {
    try {
      const response = await fetch(`${this.base}${path}`, {
        method,
        credentials: "include",
        headers: payload === undefined ? undefined : { "content-type": "application/json" },
        body: payload === undefined ? undefined : JSON.stringify(payload),
      });
      const body = (await response.json()) as ApiEnvelope<T> | ApiFailure;
      if (!response.ok || !body.success) {
        const error = body as ApiFailure;
        return { error: { code: error.error?.code ?? "REQUEST_FAILED", message: error.error?.message ?? "The request could not be completed" } };
      }
      return { data: body.data };
    } catch {
      return { error: { code: "API_UNAVAILABLE", message: "ArtDera could not reach the secure server. Please try again." } };
    }
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }
  post<T>(path: string, payload?: unknown) {
    return this.request<T>("POST", path, payload);
  }
  patch<T>(path: string, payload: unknown) {
    return this.request<T>("PATCH", path, payload);
  }
  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }
  mutate<T>(path: string, payload: unknown) {
    return this.post<T>(path, payload);
  }
  async upload<T>(path: string, form: FormData): Promise<ServiceResult<T>> {
    try {
      const response = await fetch(`${this.base}${path}`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const body = (await response.json()) as ApiEnvelope<T> | ApiFailure;
      if (!response.ok || !body.success) {
        const error = body as ApiFailure;
        return { error: { code: error.error?.code ?? "UPLOAD_FAILED", message: error.error?.message ?? "The upload failed" } };
      }
      return { data: body.data };
    } catch {
      return { error: { code: "API_UNAVAILABLE", message: "ArtDera could not reach the upload service." } };
    }
  }
}

export const apiClient = new HttpApiClient();

let activeUser: User | null = null;
let activeSubscription: Subscription | undefined;
let activeSelection: PlanSelection | undefined;
let activeDestination = "/";
let preferredBillingCycle: "monthly" | "annual" = "monthly";
let onboardingDraft: Record<string, unknown> = {};
let onboardingStep = 0;
let onboardingCompleted = false;
let artworkFormDraft: unknown;
let signupDraft: unknown;
let payments: Payment[] = [];
let invoices: Invoice[] = [];
let bootstrapPromise: Promise<void> | undefined;
let onboardingSaveTimer: ReturnType<typeof setTimeout> | undefined;

export function sanitizeText(value: string, maxLength = 1200) {
  return value.replace(/[<>\u0000-\u001F]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function containsProtectedContact(value: string) {
  return /(https?:\/\/|wa\.me|whatsapp|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?92|0)?3\d{9})/i.test(value);
}

const statusToOrderLabel: Record<string, string> = {
  awaiting_payment: "Awaiting Payment",
  paid: "Paid",
  seller_confirmed: "Seller Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  inspection_period: "Inspection Period",
  completed: "Completed",
  return_requested: "Return Requested",
  returned: "Returned",
  refunded: "Refunded",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

function mapOrder(value: Record<string, any>) {
  return {
    id: String(value.id ?? value._id),
    orderNumber: value.orderNumber,
    buyerId: String(value.buyerId),
    sellerId: String(value.sellerId),
    items: (value.items ?? []).map((item: Record<string, any>) => ({
      id: String(item.id ?? item._id),
      artworkId: String(item.artworkId),
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      image: item.image ?? "",
    })),
    status: statusToOrderLabel[value.status] ?? value.status,
    subtotal: value.subtotal ?? value.artworkSubtotal ?? 0,
    discount: value.discount ?? 0,
    shipping: value.shipping ?? value.shippingCost ?? 0,
    packaging: value.packaging ?? value.packagingCost ?? 0,
    commission: value.commission ?? value.platformCommission ?? 0,
    total: value.total ?? value.buyerTotal ?? 0,
    deliveryCity: value.deliveryCity ?? value.shippingAddress?.city ?? "",
    createdAt: value.createdAt,
    trackingNumber: value.trackingNumber,
  } as const;
}

function mapPromotion(value: Record<string, any>): Promotion {
  const label = String(value.status ?? "Draft").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return {
    id: String(value.id ?? value._id),
    artworkId: String(value.artworkId ?? ""),
    placementId: String(value.placementId ?? value.promotionType ?? "").replaceAll("_", "-"),
    status: (label === "Pending Approval" || label === "Pending Payment" ? "Pending" : label) as Promotion["status"],
    startDate: value.startDate ?? value.startAt,
    endDate: value.endDate ?? value.endAt,
    price: value.price ?? 0,
    impressions: value.impressions ?? 0,
    clicks: value.clicks ?? 0,
    saves: value.saves ?? 0,
    messages: value.messages ?? 0,
    conversions: value.conversions ?? 0,
  };
}

function mapPayment(value: Record<string, any>): Payment {
  const status = value.status === "successful" ? "Succeeded" : value.status === "failed" ? "Failed" : value.status === "processing" ? "Processing" : value.status ?? "Pending Review";
  return {
    id: String(value.id ?? value._id),
    userId: String(value.userId),
    invoiceId: value.invoiceId ? String(value.invoiceId) : undefined,
    planId: value.planId ?? value.metadata?.targetPlanId ?? activeSelection?.planId ?? "free",
    billingCycle: value.billingCycle ?? value.metadata?.billingCycle ?? activeSelection?.billingCycle ?? "free",
    method: value.method ?? value.metadata?.method ?? "card",
    amount: value.amount ?? 0,
    status,
    reference: value.reference ?? value.providerReference ?? "",
    createdAt: value.createdAt,
    failureReason: value.failureReason,
  };
}

function mergeById<T extends { id: string }>(publicItems: T[], privateItems: T[] = []) {
  return [...privateItems, ...publicItems.filter((item) => !privateItems.some((own) => own.id === item.id))];
}

function hydratePublicCatalog(data: Record<string, any>) {
  const plans = (data.plans ?? []) as SubscriptionPlan[];
  hydrateSubscriptionPlans(plans);
  hydrateRuntimeConfig(data.runtime ?? {});
  const stores = (data.stores ?? []) as Store[];
  const artworks = (data.artworks ?? []) as Artwork[];
  const creatorsRaw = (data.creators ?? []) as Array<Record<string, any>>;
  const galleriesRaw = (data.galleries ?? []) as Array<Record<string, any>>;
  const creators: EditorialCreator[] = [...creatorsRaw, ...galleriesRaw].map((creator) => ({
    slug: creator.slug ?? slugify(creator.name),
    name: creator.name,
    handle: creator.handle ?? `@${slugify(creator.name)}`,
    location: creator.location ?? "Pakistan",
    discipline: creator.title ?? creator.type ?? "Visual art",
    bio: creator.bio ?? "",
    verified: Boolean(creator.verified),
    portrait: creator.portrait || IMAGES.creator1,
    works: artworks
      .filter((artwork) => artwork.artistId === creator.id || stores.find((store) => store.id === artwork.storeId)?.ownerId === creator.id)
      .map((artwork) => artwork.slug),
  }));
  const products: Product[] = artworks.map((artwork) => {
    const store = stores.find((item) => item.id === artwork.storeId);
    const creator = creators.find((item) => item.works.includes(artwork.slug));
    return {
      slug: artwork.slug,
      title: artwork.title,
      creatorSlug: creator?.slug ?? store?.slug ?? "artdera-creator",
      categorySlug: slugify(artwork.category),
      price: artwork.discountPrice ?? artwork.price,
      currency: "PKR",
      kind: artwork.kind === "Limited Edition" ? "Limited Edition" : artwork.kind === "Print" ? "Open Edition" : "Original",
      medium: artwork.medium,
      dimensions: artwork.dimensions,
      year: artwork.year,
      framed: artwork.framed,
      colours: [],
      room: [],
      description: artwork.description,
      images: artwork.images.map((image) => image.url),
      featured: artwork.sponsored,
      new: true,
    };
  });
  const categoryTaxonomy = (data.taxonomy ?? []).filter((item: Record<string, any>) => item.type === "category");
  const categories: EditorialCategory[] = categoryTaxonomy.map((category: Record<string, any>, index: number) => ({
    slug: category.slug,
    name: category.name,
    blurb: `Browse ${category.name.toLowerCase()} available from ArtDera sellers.`,
    image: products.find((product) => product.categorySlug === category.slug)?.images[0] ?? Object.values(IMAGES)[index % 6],
  }));
  const collections: EditorialCollection[] = (data.collections ?? []).map((collection: Record<string, any>) => ({
    slug: collection.slug,
    name: collection.name,
    blurb: collection.description ?? "",
    products: (collection.artworkIds ?? []).map((id: string) => artworks.find((artwork) => artwork.id === id)?.slug).filter(Boolean),
    cover: collection.coverImage || products.find((product) => collection.artworkIds?.includes(artworks.find((artwork) => artwork.slug === product.slug)?.id))?.images[0] || IMAGES.art1,
  }));
  hydrateEditorialData({ categories, creators, products, collections });
  hydrateMarketplaceData({ stores, artworks, exhibitions: data.exhibitions ?? [] });
}

function hydratePrivate(data?: Record<string, any> | null) {
  if (!data) return;
  const ownStores = (data.stores ?? []) as Store[];
  const ownArtworks = (data.artworks ?? []) as Artwork[];
  activeSubscription = data.subscription ?? activeSubscription;
  payments = (data.payments ?? []).map(mapPayment);
  invoices = (data.invoices ?? []).map((value: Record<string, any>) => ({
    id: String(value.id ?? value._id),
    userId: String(value.userId),
    subscriptionId: String(value.subscriptionId ?? ""),
    planId: value.planId ?? activeSubscription?.planId ?? "free",
    billingCycle: value.billingCycle ?? activeSubscription?.billingCycle ?? "free",
    amount: value.amount ?? value.subtotal ?? 0,
    tax: value.tax ?? 0,
    discount: value.discount ?? 0,
    total: value.total ?? 0,
    status: value.status === "paid" ? "Paid" : value.status === "void" ? "Voided" : value.status ?? "Pending",
    issuedAt: value.issuedAt,
  }));
  hydrateMarketplaceData({
    stores: mergeById(STORES, ownStores),
    artworks: mergeById(ARTWORKS, ownArtworks),
    orders: (data.orders ?? []).map(mapOrder),
    conversations: (data.conversations ?? []).map((item: Record<string, any>) => ({
      id: String(item.id ?? item._id),
      participantIds: item.participantIds ?? item.participants?.map(String) ?? [],
      artworkId: item.artworkId ? String(item.artworkId) : undefined,
      lastMessageAt: item.lastMessageAt ?? item.updatedAt,
      unreadCount: item.unreadCount ?? 0,
      status: String(item.status ?? "Active").replace(/^./, (letter) => letter.toUpperCase()),
    })) as Conversation[],
    messages: (data.messages ?? []) as Message[],
    notifications: data.notifications ?? [],
    promotions: (data.promotions ?? []).map(mapPromotion),
    payouts: data.payouts ?? [],
    shipments: data.shipments ?? [],
    reviews: data.reviews ?? [],
  });
}

export class MarketplaceService {
  static async initialize() {
    const session = await apiClient.get<{ user: User | null; subscription: Subscription | null; destination?: string }>("/api/auth/session");
    if (session.data) {
      activeUser = session.data.user;
      activeSubscription = session.data.subscription ?? undefined;
      activeDestination = session.data.destination ?? "/";
    }
    await this.bootstrap(true);
    return activeUser;
  }

  static async bootstrap(force = false) {
    if (bootstrapPromise && !force) return bootstrapPromise;
    bootstrapPromise = (async () => {
      const result = await apiClient.get<Record<string, any>>("/api/bootstrap");
      if (result.error) throw new Error(result.error.message);
      hydratePublicCatalog(result.data!);
      hydratePrivate(result.data!.private);
      if (!activeSelection && activeSubscription && PLANS[activeSubscription.planId]) {
        const plan = PLANS[activeSubscription.planId];
        activeSelection = {
          planId: activeSubscription.planId,
          billingCycle: activeSubscription.billingCycle,
          price: activeSubscription.price,
          commission: activeSubscription.commission,
          listingLimit: activeSubscription.listingLimit,
          features: [...plan.features],
          selectedAt: activeSubscription.startedAt ?? new Date().toISOString(),
        };
      }
      if (activeUser?.role === "admin") {
        const admin = await apiClient.get<Record<string, any>>("/api/admin/dashboard");
        if (admin.data) {
          hydrateAdminMetrics(admin.data.metrics ?? {});
          hydrateMarketplaceData({
            users: admin.data.users ?? [],
            stores: mergeById(STORES, admin.data.stores ?? []),
            artworks: mergeById(ARTWORKS, admin.data.artworks ?? []),
            orders: (admin.data.orders ?? []).map(mapOrder),
            promotions: (admin.data.promotions ?? []).map(mapPromotion),
            auditLogs: admin.data.auditLogs ?? [],
          });
        }
      }
      if (activeUser && ["artist", "gallery", "gallery_staff"].includes(activeUser.role)) {
        const draft = await apiClient.get<{ step: number; data: Record<string, unknown>; completedAt?: string }>("/api/stores/onboarding/draft/current");
        if (draft.data) {
          onboardingStep = draft.data.step;
          onboardingDraft = draft.data.data ?? {};
          onboardingCompleted = Boolean(draft.data.completedAt || STORES.some((store) => store.ownerId === activeUser?.id));
        }
        const artDraft = await apiClient.get<unknown>("/api/drafts/artwork-form");
        artworkFormDraft = artDraft.data ?? undefined;
      }
    })().finally(() => {
      bootstrapPromise = undefined;
    });
    return bootstrapPromise;
  }
}

export class UserService {
  static list() {
    return SEEDED_USERS;
  }
  static getById(id: string) {
    return SEEDED_USERS.find((user) => user.id === id) ?? (activeUser?.id === id ? activeUser : undefined);
  }
  static async create(input: Record<string, any> & { password: string }) {
    const payload = {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? input.mobile,
      password: input.password,
      role: input.role ?? "buyer",
      sellerType: input.sellerType,
      city: input.city,
      province: input.province,
      country: input.country ?? "Pakistan",
      termsAccepted: input.termsAccepted ?? input.terms ?? true,
      privacyAccepted: input.privacyAccepted ?? input.terms ?? true,
      planId: input.planId ?? activeSelection?.planId,
      billingCycle: input.billingCycle ?? activeSelection?.billingCycle,
    };
    const result = await apiClient.post<User>("/api/auth/register", payload);
    if (result.data) {
      activeUser = result.data;
      if (!SEEDED_USERS.some((user) => user.id === result.data!.id)) SEEDED_USERS.unshift(result.data);
      await MarketplaceService.bootstrap(true);
    }
    return result;
  }
  static async updateContact(_userId: string, input: { email?: string; mobile?: string }) {
    const result = await apiClient.patch<User>("/api/auth/contact", { email: input.email, mobile: input.mobile });
    if (result.data) activeUser = result.data;
    return result.data;
  }
  static async updateRole(_userId: string, _role: "artist" | "gallery") {
    return activeUser ?? undefined;
  }
}

export class AuthService {
  static async login(email: string, password: string): Promise<ServiceResult<{ user: User; destination: string }>> {
    const result = await apiClient.post<{ user: User; destination: string }>("/api/auth/login", { email, password });
    if (result.data) {
      activeUser = result.data.user;
      activeDestination = result.data.destination;
      await MarketplaceService.bootstrap(true);
    }
    return result;
  }
  static startSession(user: User) {
    activeUser = user;
  }
  static async currentUser() {
    return MarketplaceService.initialize();
  }
  static getSession() {
    return activeUser ? { userId: activeUser.id, role: activeUser.role, email: activeUser.email, expiresAt: 0 } : null;
  }
  static async logout() {
    await apiClient.post("/api/auth/logout");
    activeUser = null;
    activeSubscription = undefined;
    activeSelection = undefined;
  }
  static async requestPasswordReset(email: string) {
    return apiClient.post<{ accepted: boolean }>("/api/auth/forgot-password", { email });
  }
  static async resetPassword(email: string, code: string, password: string) {
    return apiClient.post<{ reset: boolean }>("/api/auth/reset-password", { email, code, password });
  }
  static destination() {
    return activeDestination;
  }
}

export class ArtistService {
  static getStoreForUser(userId: string) {
    return STORES.find((store) => store.ownerId === userId);
  }
}

export class StoreService {
  static list() {
    return STORES;
  }
  static getBySlug(slug: string) {
    return STORES.find((store) => store.slug === slug);
  }
  static async fetchBySlug(slug: string) {
    const result = await apiClient.get<{ store: Store; artworks: Artwork[] }>(`/api/stores/${encodeURIComponent(slug)}`);
    if (result.data) {
      const storeIndex = STORES.findIndex((item) => item.id === result.data!.store.id);
      if (storeIndex >= 0) STORES[storeIndex] = result.data.store;
      else STORES.push(result.data.store);
      for (const artwork of result.data.artworks) {
        const index = ARTWORKS.findIndex((item) => item.id === artwork.id);
        if (index >= 0) ARTWORKS[index] = artwork;
        else ARTWORKS.push(artwork);
      }
    }
    return result;
  }
  static async save(store: Store) {
    const existing = /^[a-f\d]{24}$/i.test(store.id);
    const payload = {
      name: store.name,
      slug: store.slug,
      tagline: store.tagline,
      shortDescription: store.bio,
      fullDescription: store.story,
      logoUrl: store.profileImage,
      coverImageUrl: store.coverImage,
      city: store.location.split(",")[0]?.trim(),
      country: store.location.split(",")[1]?.trim() || "Pakistan",
      categories: store.categories,
      mediums: store.mediums,
      styles: [],
      themes: [],
      status: store.status === "Published" ? "active" : "draft",
    };
    const result = existing
      ? await apiClient.patch<Store>(`/api/stores/${store.id}`, payload)
      : await apiClient.post<Store>("/api/stores", payload);
    if (result.data) {
      const index = STORES.findIndex((item) => item.id === result.data!.id);
      if (index >= 0) STORES[index] = result.data;
      else STORES.unshift(result.data);
    }
    return result;
  }
}

export class ArtworkService {
  static list() {
    return ARTWORKS;
  }
  static forStore(storeId: string) {
    return ARTWORKS.filter((artwork) => artwork.storeId === storeId);
  }
  static async save(artwork: Artwork) {
    const existing = /^[a-f\d]{24}$/i.test(artwork.id);
    const payload = {
      storeId: artwork.storeId,
      title: artwork.title,
      slug: artwork.slug,
      description: artwork.description,
      category: artwork.category,
      medium: artwork.medium,
      style: artwork.style,
      subject: artwork.subject,
      year: artwork.year,
      kind: artwork.kind,
      price: artwork.price,
      discountPrice: artwork.discountPrice,
      dimensions: artwork.dimensions,
      weightKg: artwork.weightKg,
      framed: artwork.framed,
      orientation: artwork.orientation,
      images: artwork.images,
      status: artwork.status,
      quantity: artwork.quantity,
      domesticShipping: artwork.domesticShipping,
      internationalShipping: artwork.internationalShipping,
      certificate: artwork.certificate,
      tags: artwork.tags,
      customOrders: artwork.customOrders,
    };
    const result = existing
      ? await apiClient.patch<Artwork>(`/api/artworks/${artwork.id}`, payload)
      : await apiClient.post<Artwork>("/api/artworks", payload);
    if (result.data) {
      const index = ARTWORKS.findIndex((item) => item.id === result.data!.id);
      if (index >= 0) ARTWORKS[index] = result.data;
      else ARTWORKS.unshift(result.data);
    }
    return result;
  }
  static async updateMany(ids: string[], status: Artwork["status"]) {
    const action = status === "Archived" ? "archive" : status === "Draft" ? "restore" : "submit";
    const result = await apiClient.patch<Artwork[]>("/api/artworks/bulk", { ids, action });
    if (result.data) {
      for (const artwork of result.data) {
        const index = ARTWORKS.findIndex((item) => item.id === artwork.id);
        if (index >= 0) ARTWORKS[index] = artwork;
      }
    }
    return result.data ?? ARTWORKS;
  }
  static async deleteMany(ids: string[]) {
    const result = await apiClient.patch<{ ids: string[] }>("/api/artworks/bulk", { ids, action: "delete" });
    if (result.data) ARTWORKS.splice(0, ARTWORKS.length, ...ARTWORKS.filter((item) => !ids.includes(item.id)));
    return ARTWORKS;
  }
}

export class ArtworkDraftService {
  static read<T>(fallback: T) {
    return (artworkFormDraft as T | undefined) ?? fallback;
  }
  static save<T>(value: T) {
    artworkFormDraft = value;
    void apiClient.patch("/api/drafts/artwork-form", { data: value });
    return true;
  }
  static clear() {
    artworkFormDraft = undefined;
    void apiClient.delete("/api/drafts/artwork-form");
  }
}

export class UploadService {
  static async upload(file: File, purpose: "artwork" | "profile" | "cover" | "message" | "verification") {
    const form = new FormData();
    form.set("file", file);
    form.set("purpose", purpose);
    form.set("access", purpose === "verification" ? "private" : "public");
    return apiClient.upload<{ id: string; publicId: string; url: string; mimeType: string; size: number; access: "public" | "private" }>("/api/uploads", form);
  }
}

export type CartEntry = {
  artwork: Artwork;
  quantity: number;
  priceChanged: boolean;
  available: boolean;
};

export class CartService {
  static get() {
    return apiClient.get<{ items: CartEntry[]; subtotal: number }>("/api/cart");
  }
  static add(artworkId: string, quantity = 1) {
    return apiClient.post<{ artworkId: string; quantity: number }>("/api/cart/items", { artworkId, quantity });
  }
  static remove(artworkId: string) {
    return apiClient.delete<{ artworkId: string }>(`/api/cart/items/${artworkId}`);
  }
}

export class WishlistService {
  static list() {
    return apiClient.get<Artwork[]>("/api/wishlist");
  }
  static save(artworkId: string) {
    return apiClient.post<{ artworkId: string; saved: boolean }>(`/api/wishlist/${artworkId}`);
  }
  static remove(artworkId: string) {
    return apiClient.delete<{ artworkId: string; saved: boolean }>(`/api/wishlist/${artworkId}`);
  }
}

export class FollowService {
  static list() {
    return apiClient.get<Store[]>("/api/follows");
  }
  static follow(storeId: string) {
    return apiClient.post<{ storeId: string; following: boolean }>(`/api/follows/${storeId}`);
  }
  static unfollow(storeId: string) {
    return apiClient.delete<{ storeId: string; following: boolean }>(`/api/follows/${storeId}`);
  }
}

export type CheckoutAddress = {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
  phone: string;
};

export type CheckoutResult = {
  orders: Array<{
    order: ReturnType<typeof mapOrder>;
    payment: { id: string; status: string; amount: number };
    invoiceId: string;
    shipmentId: string;
  }>;
  estimateNotice: string;
};

export class CheckoutService {
  static create(input: { shippingAddress: CheckoutAddress; billingAddress?: CheckoutAddress; method: PaymentMethod }) {
    return apiClient.post<CheckoutResult>("/api/checkout", input);
  }
  static confirmDemo(paymentId: string, outcome: "success" | "failure" = "success") {
    return apiClient.post<{ payment: Record<string, unknown>; order: Record<string, any> }>(`/api/order-payments/${paymentId}/confirm-demo`, { outcome });
  }
}

export class OrderService {
  static listFor(userId: string, role: UserRole) {
    return ORDERS.filter((order) => (role === "buyer" ? order.buyerId === userId : order.sellerId === userId));
  }
  static async refresh() {
    const result = await apiClient.get<Array<Record<string, any>>>("/api/orders");
    if (result.data) hydrateMarketplaceData({ orders: result.data.map(mapOrder) });
    return result;
  }
  static async updateStatus(id: string, status: string) {
    const apiStatus = status.toLowerCase().replaceAll(" ", "_");
    const result = await apiClient.patch<Record<string, any>>(`/api/orders/${id}/status`, { status: apiStatus });
    if (result.data) {
      const mapped = mapOrder(result.data);
      const index = ORDERS.findIndex((item) => item.id === id);
      if (index >= 0) ORDERS[index] = mapped;
    }
    return result;
  }
  static shipping(orderId: string) {
    return apiClient.get<Record<string, any> | null>(`/api/shipping/${orderId}`);
  }
  static updateShipping(orderId: string, input: { courier?: string; trackingNumber?: string; status?: string; actualCost?: number }) {
    return apiClient.patch<Record<string, any>>(`/api/shipping/${orderId}`, input);
  }
}

export class NotificationService {
  static list() {
    return apiClient.get<Notification[]>("/api/notifications");
  }
  static read(id: string) {
    return apiClient.patch<{ id: string; read: boolean }>(`/api/notifications/${id}/read`, {});
  }
  static readAll() {
    return apiClient.post<{ read: boolean }>("/api/notifications/read-all");
  }
  static remove(id: string) {
    return apiClient.delete<{ id: string }>(`/api/notifications/${id}`);
  }
  static preferences() {
    return apiClient.get<Record<string, boolean>>("/api/notification-preferences");
  }
  static updatePreferences(input: Record<string, boolean>) {
    return apiClient.patch<Record<string, boolean>>("/api/notification-preferences", input);
  }
}

export class SupportService {
  static list() {
    return apiClient.get<Record<string, unknown>[]>("/api/support");
  }
  static create(input: { category: string; subject: string; description: string; priority?: "low" | "normal" | "high" }) {
    return apiClient.post<Record<string, unknown>>("/api/support", input);
  }
  static reply(id: string, message: string) {
    return apiClient.post<Record<string, unknown>>(`/api/support/${id}/messages`, { message });
  }
}

export class CustomerService {
  static list() {
    return apiClient.get<Record<string, unknown>[]>("/api/customers");
  }
}

export class ReviewService {
  static publicForStore(storeId: string) {
    return apiClient.get<Array<{ id: string; rating: number; title: string; body: string; sellerResponse?: string; createdAt: string }>>(`/api/reviews/public/${storeId}`);
  }
  static create(input: { orderId: string; artworkId: string; rating: number; title: string; comment: string }) {
    return apiClient.post<Record<string, unknown>>("/api/reviews", input);
  }
  static respond(id: string, response: string) {
    return apiClient.patch<Record<string, unknown>>(`/api/reviews/${id}/respond`, { response });
  }
}

export class MessageService {
  static conversationsFor(userId: string) {
    return CONVERSATIONS.filter((conversation) => conversation.participantIds.includes(userId));
  }
  static messagesFor(conversationId: string) {
    return MESSAGES.filter((message) => message.conversationId === conversationId);
  }
  static async listConversations() {
    const result = await apiClient.get<Conversation[]>("/api/messages/conversations");
    if (result.data) CONVERSATIONS.splice(0, CONVERSATIONS.length, ...result.data);
    return result;
  }
  static async getConversation(id: string) {
    const result = await apiClient.get<{ conversation: Conversation; messages: Message[]; offers: Record<string, unknown>[]; consultations: Record<string, unknown>[] }>(`/api/messages/conversations/${id}`);
    if (result.data) {
      const conversationIndex = CONVERSATIONS.findIndex((item) => item.id === id);
      if (conversationIndex >= 0) CONVERSATIONS[conversationIndex] = result.data.conversation;
      else CONVERSATIONS.unshift(result.data.conversation);
      MESSAGES.splice(0, MESSAGES.length, ...MESSAGES.filter((item) => item.conversationId !== id), ...result.data.messages);
    }
    return result;
  }
  static async createConversation(storeId: string, artworkId?: string, message?: string) {
    const result = await apiClient.post<Conversation>("/api/messages/conversations", { storeId, artworkId, message });
    if (result.data && !CONVERSATIONS.some((item) => item.id === result.data!.id)) CONVERSATIONS.unshift(result.data);
    return result;
  }
  static async send(conversationId: string, text: string) {
    const result = await apiClient.post<Message>(`/api/messages/conversations/${conversationId}/messages`, { text, type: "text", attachments: [] });
    if (result.data) MESSAGES.push(result.data);
    return result;
  }
  static markRead(conversationId: string) {
    return apiClient.post<{ read: boolean }>(`/api/messages/conversations/${conversationId}/read`);
  }
  static changeStatus(conversationId: string, action: "archive" | "unarchive" | "block" | "unblock" | "report") {
    return apiClient.patch<Conversation>(`/api/messages/conversations/${conversationId}/status`, { action });
  }
  static createOffer(conversationId: string, offeredPrice: number, message?: string) {
    return apiClient.post<Record<string, unknown>>("/api/messages/offers", { conversationId, offeredPrice, message, expiresInHours: 48 });
  }
  static updateOffer(id: string, action: "accept" | "reject" | "counter" | "withdraw", counterPrice?: number) {
    return apiClient.patch<Record<string, unknown>>(`/api/messages/offers/${id}`, { action, counterPrice });
  }
  static requestConsultation(input: { conversationId: string; requestedDate: string; requestedTime: string; timezone: string; message?: string }) {
    return apiClient.post<Record<string, unknown>>("/api/messages/consultations", input);
  }
  static updateConsultation(id: string, input: { action: "accept" | "reject" | "suggest_alternate" | "cancel" | "complete"; meetingUrl?: string }) {
    return apiClient.patch<Record<string, unknown>>(`/api/messages/consultations/${id}`, input);
  }
}

export class PromotionService {
  static list() {
    return PROMOTIONS;
  }
  static async create(input: Omit<Promotion, "id">) {
    const result = await apiClient.post<{ promotion: Record<string, any>; payment: { id: string } }>("/api/promotions", {
      artworkId: input.artworkId,
      promotionType: input.placementId.replaceAll("-", "_"),
      requestedPrice: input.price,
      placement: input.placementId,
      startAt: input.startDate,
    });
    if (result.error) return result;
    const confirmation = await apiClient.post<Record<string, any>>(`/api/promotions/${result.data!.promotion.id}/confirm-demo`, { outcome: "success" });
    if (confirmation.error) return confirmation;
    const promotion = mapPromotion(confirmation.data!);
    PROMOTIONS.unshift(promotion);
    return { data: promotion } satisfies ServiceResult<Promotion>;
  }
}

export class AdminService {
  static canAccess(user?: User | null) {
    return user?.role === "admin";
  }
  static resource(resource: string, page = 1, query = "") {
    const search = query ? `&q=${encodeURIComponent(query)}` : "";
    return apiClient.get<{ items: Array<Record<string, any>>; page: number; limit: number; total: number; pages: number }>(`/api/admin/resources/${encodeURIComponent(resource)}?page=${page}&limit=50${search}`);
  }
  static userStatus(id: string, status: "active" | "suspended" | "locked" | "deleted") {
    return apiClient.patch<User>(`/api/admin/users/${id}/status`, { status });
  }
  static moderateArtwork(id: string, decision: "approve" | "reject", reason?: string) {
    return apiClient.patch<Artwork>(`/api/admin/artworks/${id}/moderation`, { decision, reason });
  }
  static verification(id: string, decision: "approve" | "reject" | "request_changes" | "remove", reason?: string) {
    return apiClient.patch<Record<string, unknown>>(`/api/admin/verification/${id}`, { decision, reason });
  }
  static promotion(id: string, decision: "approve" | "reject" | "cancel", reason?: string) {
    return apiClient.patch<Record<string, unknown>>(`/api/admin/promotions/${id}`, { decision, reason });
  }
  static plan(planId: PlanId, input: { monthlyPrice?: number; annualPrice?: number | null; listingLimit?: number | null; commissionRate?: number; features?: string[]; permissions?: string[]; isActive?: boolean }) {
    return apiClient.patch<SubscriptionPlan>(`/api/plans/${planId}`, input);
  }
}

export class PlanService {
  static list() {
    return Object.values(PLANS);
  }
  static get(planId: PlanId) {
    return PLANS[planId];
  }
  static isValid(value: unknown): value is PlanId {
    return isPlanId(value);
  }
  static price(planId: PlanId, billingCycle: BillingCycle) {
    return planPrice(planId, billingCycle);
  }
  static higherThan(planId: PlanId) {
    return this.list().filter((plan) => PLAN_RANK[plan.id] > PLAN_RANK[planId]);
  }
}

function emptyFlow(): ArtistFlowState {
  return {
    selection: activeSelection,
    preferredBilling: preferredBillingCycle,
    userId: activeUser?.id,
    signupComplete: Boolean(activeUser),
    verificationComplete: Boolean((activeUser as User & { emailVerified?: boolean } | null)?.emailVerified),
    paymentComplete: activeSubscription?.status === "Active",
    paymentStatus: activeSubscription?.status === "Active" ? "Succeeded" : undefined,
    onboardingStep,
    onboardingComplete: onboardingCompleted,
    storeId: activeUser ? STORES.find((store) => store.ownerId === activeUser!.id)?.id : undefined,
    updatedAt: new Date().toISOString(),
  };
}

export class SubscriptionService {
  static getFlow() {
    return emptyFlow();
  }
  static saveFlow(patch: Partial<ArtistFlowState>) {
    if (patch.selection) activeSelection = patch.selection;
    if (patch.preferredBilling === "monthly" || patch.preferredBilling === "annual") preferredBillingCycle = patch.preferredBilling;
    if (typeof patch.onboardingStep === "number") onboardingStep = patch.onboardingStep;
    if (typeof patch.onboardingComplete === "boolean") onboardingCompleted = patch.onboardingComplete;
    return { ...emptyFlow(), ...patch };
  }
  static async selectPlan(planId: PlanId, requestedCycle?: BillingCycle) {
    const billingCycle = validBillingCycle(planId, requestedCycle);
    const result = await apiClient.post<PlanSelection>("/api/plans/select", { planId, billingCycle });
    if (result.data) {
      activeSelection = result.data;
      preferredBillingCycle = result.data.billingCycle === "annual" ? "annual" : "monthly";
    }
    return result;
  }
  static getSelection() {
    return activeSelection;
  }
  static preferredBilling() {
    return preferredBillingCycle;
  }
  static setPreferredBilling(value: "monthly" | "annual") {
    preferredBillingCycle = value;
    return emptyFlow();
  }
  static attachUser(userId: string) {
    return this.saveFlow({ userId, signupComplete: true });
  }
  static markVerified(userId: string) {
    return this.saveFlow({ userId, verificationComplete: true });
  }
  static markPayment(status: Payment["status"]) {
    return this.saveFlow({ paymentStatus: status, paymentComplete: status === "Succeeded" });
  }
  static markOnboardingStep(step: number) {
    onboardingStep = Math.max(0, Math.min(7, step));
    return emptyFlow();
  }
  static confirmGalleryRegistration(userId: string) {
    return this.saveFlow({ userId, galleryRegistrationConfirmed: true });
  }
  static completeOnboarding(storeId: string) {
    onboardingCompleted = true;
    onboardingStep = 7;
    return this.saveFlow({ storeId, onboardingComplete: true, onboardingStep: 7 });
  }
  static destinationFor(user: User) {
    if (!["artist", "gallery", "gallery_staff"].includes(user.role)) return ROLE_HOME[user.role];
    if (!(user as User & { emailVerified?: boolean }).emailVerified) return "/artist/verify";
    if (!activeSubscription) return "/sell/plans";
    if (activeSubscription.planId !== "free" && activeSubscription.status !== "Active") return "/artist/checkout";
    return onboardingCompleted ? "/artist/dashboard" : "/artist/onboarding";
  }
  static list() {
    return activeSubscription ? [activeSubscription] : [];
  }
  static getForUser(userId: string) {
    return activeSubscription?.userId === userId ? activeSubscription : undefined;
  }
  static async activate(_userId: string, planId: PlanId, requestedCycle: BillingCycle) {
    const selected = await this.selectPlan(planId, requestedCycle);
    return selected.data;
  }
  static async updateStatus(_userId: string, status: Subscription["status"]) {
    if (status !== "Cancelled") return activeSubscription;
    const result = await apiClient.post<Subscription>("/api/subscriptions/cancel", { immediately: false });
    if (result.data) activeSubscription = result.data;
    return result.data;
  }
  static async scheduleDowngrade(userId: string, toPlanId: PlanId, effective: PlanDowngrade["effective"]) {
    const current = this.getForUser(userId);
    if (!current) return undefined;
    const result = await apiClient.post<{ subscription?: Subscription; archivedArtworkIds?: string[] } | Subscription>("/api/subscriptions/change", {
      planId: toPlanId,
      billingCycle: toPlanId === "free" ? "free" : "monthly",
      effective,
      keepArtworkIds: ArtworkService.list().filter((artwork) => ["Published", "Pending Review", "Reserved"].includes(artwork.status)).slice(0, PLANS[toPlanId].listingLimit ?? 200).map((artwork) => artwork.id),
    });
    if (result.error) return undefined;
    const value = result.data as { subscription?: Subscription; archivedArtworkIds?: string[] };
    activeSubscription = value.subscription ?? (result.data as Subscription);
    return {
      id: `server-${Date.now()}`,
      userId,
      fromPlanId: current.planId,
      toPlanId,
      effective,
      effectiveAt: activeSubscription?.pendingChangeAt ?? new Date().toISOString(),
      archivedArtworkIds: value.archivedArtworkIds ?? [],
      status: effective === "immediately" ? "Completed" : "Scheduled",
    } satisfies PlanDowngrade;
  }
  static planFor(role: UserRole): PlanId {
    return role === "gallery" || role === "gallery_staff" ? "gallery" : role === "artist" ? "professional" : "free";
  }
  static planForUser(user: User): PlanId {
    return this.getForUser(user.id)?.planId ?? this.planFor(user.role);
  }
}

export class InvoiceService {
  static listFor(userId: string) {
    return invoices.filter((invoice) => invoice.userId === userId);
  }
  static create(_userId: string, _subscription: Subscription, _status: Invoice["status"] = "Paid") {
    return invoices[0];
  }
}

export class PaymentService {
  static listFor(userId: string) {
    return payments.filter((payment) => payment.userId === userId);
  }
  static async process(input: { userId: string; method: PaymentMethod; simulateFailure?: boolean; pendingReview?: boolean }) {
    if (!activeSelection || activeSelection.planId === "free") {
      return { error: { code: "NO_PAID_PLAN", message: "A paid plan is required for checkout." } } satisfies ServiceResult<Payment>;
    }
    const initiated = await apiClient.post<Record<string, any>>("/api/subscriptions/payment", {
      planId: activeSelection.planId,
      billingCycle: activeSelection.billingCycle,
      method: input.method,
    });
    if (initiated.error) return initiated as ServiceResult<Payment>;
    if (input.pendingReview) {
      const pending = mapPayment(initiated.data!);
      payments.unshift(pending);
      return { data: pending };
    }
    if (!DEMO_PAYMENT_MODE) {
      const pending = mapPayment(initiated.data!);
      payments.unshift(pending);
      return { data: pending };
    }
    const confirmed = await apiClient.post<{ payment: Record<string, any> }>(`/api/subscriptions/payment/${initiated.data!.id}/confirm-demo`, {
      outcome: input.simulateFailure ? "failure" : "success",
    });
    if (confirmed.error) return { error: confirmed.error } as ServiceResult<Payment>;
    const payment = mapPayment(confirmed.data!.payment);
    payments.unshift(payment);
    await MarketplaceService.bootstrap(true);
    return { data: payment };
  }
}

export class VerificationService {
  static async verify(userId: string, code: string) {
    const result = await apiClient.post<{ verified: boolean; subscription?: Subscription }>("/api/auth/verify-email", { code });
    if (result.data) {
      SubscriptionService.markVerified(userId);
      if (result.data.subscription) activeSubscription = result.data.subscription;
      await MarketplaceService.bootstrap(true);
    }
    return result;
  }
}

export class FeatureAccessService {
  static canAccess(planId: PlanId, module: string) {
    return Boolean(PLANS[planId]?.allowedModules.includes(module));
  }
  static requiredPlan(module: string): PlanId {
    if (["managed-artists", "staff", "inventory", "exhibitions", "reports"].includes(module)) return "gallery";
    if (["advanced-analytics", "customers", "premium-url", "international-tools"].includes(module)) return "pro-plus";
    return "professional";
  }
  static usage(userId: string, storeId?: string): PlanUsage {
    const artworks = storeId ? ArtworkService.forStore(storeId) : [];
    return {
      userId,
      activeListings: artworks.filter((artwork) => ["Published", "Pending Review", "Reserved"].includes(artwork.status)).length,
      managedArtists: 0,
      staffAccounts: STAFF.length,
      exhibitionPages: EXHIBITIONS.length,
      storageUsedMb: 0,
    };
  }
}

export class PlanChangeService {
  static recordUpgrade(userId: string, fromPlanId: PlanId, toPlanId: PlanId, paymentId?: string): PlanUpgrade {
    return { id: paymentId ?? `upgrade-${Date.now()}`, userId, fromPlanId, toPlanId, effectiveAt: new Date().toISOString(), paymentId, status: "Completed" };
  }
}

export class OnboardingService {
  static read<T>(fallback: T) {
    return Object.keys(onboardingDraft).length ? (onboardingDraft as T) : fallback;
  }
  static save<T>(value: T, step = onboardingStep) {
    onboardingDraft = value as Record<string, unknown>;
    onboardingStep = step;
    if (onboardingSaveTimer) clearTimeout(onboardingSaveTimer);
    onboardingSaveTimer = setTimeout(() => {
      void apiClient.patch("/api/stores/onboarding/draft/current", { data: value, step });
    }, 350);
    return true;
  }
  static async complete<T>(data: T) {
    const result = await apiClient.post<{ store: Store; artwork?: Artwork }>("/api/stores/onboarding/complete", { data });
    if (result.data) {
      onboardingCompleted = true;
      onboardingStep = 7;
      onboardingDraft = {};
      await MarketplaceService.bootstrap(true);
    }
    return result;
  }
  static clear() {
    onboardingDraft = {};
  }
}

export class SignupProgressService {
  static read<T>(fallback: T) {
    return (signupDraft as T | undefined) ?? fallback;
  }
  static save<T>(value: T) {
    signupDraft = value;
    return true;
  }
  static clear() {
    signupDraft = undefined;
  }
}

export function canAccessRole(user: User | null, roles: UserRole[]) {
  return Boolean(user && roles.includes(user.role));
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Re-export live collections for modules that use the service adapter as their data boundary.
export const marketplaceState = {
  users: SEEDED_USERS,
  stores: STORES,
  artworks: ARTWORKS,
  orders: ORDERS,
  conversations: CONVERSATIONS,
  messages: MESSAGES,
  promotions: PROMOTIONS,
  shipments: SHIPMENTS,
  payouts: PAYOUTS,
  staff: STAFF,
  exhibitions: EXHIBITIONS,
  customers: CUSTOMERS,
  reviews: REVIEWS,
  verifications: VERIFICATIONS,
  notifications: NOTIFICATIONS,
  analytics: ANALYTICS,
  auditLog: AUDIT_LOG,
  adminMetrics: ADMIN_METRICS,
  categories: CATEGORIES,
  creators: CREATORS,
  products: PRODUCTS,
  collections: COLLECTIONS,
};
