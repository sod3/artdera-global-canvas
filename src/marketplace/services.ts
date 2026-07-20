import {
  ARTWORKS,
  CONVERSATIONS,
  MESSAGES,
  NOTIFICATIONS,
  ORDERS,
  PROMOTIONS,
  SEEDED_USERS,
  STORES,
} from "./data";
import { PLANS, ROLE_HOME, SESSION_DURATION_MS } from "./config";
import { isPlanId, PLAN_RANK, planPrice, validBillingCycle } from "@/config/subscription-plans";
import type {
  Artwork,
  ArtistFlowState,
  BillingCycle,
  Conversation,
  DemoSession,
  Invoice,
  Message,
  Notification,
  Order,
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
  User,
  UserRole,
} from "./types";

const STORAGE_PREFIX = "artdera.demo.v1";
const SESSION_KEY = `${STORAGE_PREFIX}.session`;
const USERS_KEY = `${STORAGE_PREFIX}.users`;
const ARTWORKS_KEY = `${STORAGE_PREFIX}.artworks`;
const STORES_KEY = `${STORAGE_PREFIX}.stores`;
const FLOW_KEY = `${STORAGE_PREFIX}.artist-flow`;
const SUBSCRIPTIONS_KEY = `${STORAGE_PREFIX}.subscriptions`;
const PAYMENTS_KEY = `${STORAGE_PREFIX}.payments`;
const INVOICES_KEY = `${STORAGE_PREFIX}.invoices`;
const UPGRADES_KEY = `${STORAGE_PREFIX}.upgrades`;
const DOWNGRADES_KEY = `${STORAGE_PREFIX}.downgrades`;
const ONBOARDING_KEY = `${STORAGE_PREFIX}.onboarding`;
const SIGNUP_KEY = `${STORAGE_PREFIX}.signup-draft`;
const PROMOTIONS_KEY = `${STORAGE_PREFIX}.promotions`;
const ARTWORK_DRAFT_KEY = `${STORAGE_PREFIX}.artwork-draft`;

const SEEDED_PASSWORD_HASHES: Record<string, string> = {
  "free.artist@artdera.demo": "96724c2ae39ead1295544c3ff70d097545ee8cd2a93ef7ffe353e16b67a7960b",
  "professional.artist@artdera.demo":
    "3d351250c9fedab916f07f42029020ead54f4851ee933a0685d27d568f465fbf",
  "pro.artist@artdera.demo": "c4695a77aaecd3e425640eebf55ae1c5480b5a774d48294dff4dea530c4155b7",
  "artist@artdera.demo": "eaffe67e73930631375d1f7ad0062da681a666075b0cf5e082b4eaff53798731",
  "gallery@artdera.demo": "fdbaaf113d71bfda8f1182f93db624ca3481652ddea9c9f2602ddf1e05394646",
  "buyer@artdera.demo": "0419c54f2ceb168975b8c4e9cea7287c343b2f2ab5426100ef958c4ebc191052",
  "admin@artdera.demo": "1566d2f0efacdf886816a770422c5085f3e2a396219a02e333aba71e77bab1e9",
};

type StoredUser = User & { passwordHash?: string; planId?: PlanId };

function browserStorage(kind: "local" | "session") {
  if (typeof window === "undefined") return undefined;
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

class StorageRepository {
  read<T>(key: string, fallback: T, kind: "local" | "session" = "local"): T {
    const storage = browserStorage(kind);
    if (!storage) return fallback;
    try {
      const value = storage.getItem(key);
      return value ? (JSON.parse(value) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, value: T, kind: "local" | "session" = "local") {
    try {
      browserStorage(kind)?.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string, kind: "local" | "session" = "local") {
    browserStorage(kind)?.removeItem(key);
  }
}

const storage = new StorageRepository();

export function sanitizeText(value: string, maxLength = 1200) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function containsProtectedContact(value: string) {
  return /(https?:\/\/|wa\.me|whatsapp|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?92|0)?3\d{9})/i.test(
    value,
  );
}

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(`artdera-demo-v1:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export interface ApiClient {
  get<T>(resource: string): Promise<ServiceResult<T>>;
  mutate<T>(resource: string, payload: unknown): Promise<ServiceResult<T>>;
}

export class MockApiClient implements ApiClient {
  async get<T>(resource: string): Promise<ServiceResult<T>> {
    const resources: Record<string, unknown> = {
      users: UserService.list(),
      stores: STORES,
      artworks: ArtworkService.list(),
      orders: ORDERS,
      conversations: CONVERSATIONS,
      messages: MESSAGES,
      promotions: PROMOTIONS,
      notifications: NOTIFICATIONS,
    };
    if (!(resource in resources))
      return { error: { code: "NOT_FOUND", message: "That demo resource is not available." } };
    return { data: structuredClone(resources[resource]) as T };
  }

  async mutate<T>(_resource: string, payload: unknown): Promise<ServiceResult<T>> {
    return { data: structuredClone(payload) as T };
  }
}

export const apiClient: ApiClient = new MockApiClient();

export class UserService {
  static list(): StoredUser[] {
    const stored = storage.read<StoredUser[]>(USERS_KEY, []);
    const seeded = SEEDED_USERS.map((seed) => stored.find((user) => user.id === seed.id) ?? seed);
    const extras = stored.filter((user) => !SEEDED_USERS.some((seed) => seed.id === user.id));
    return [...seeded, ...extras];
  }

  static getById(id: string) {
    return this.list().find((user) => user.id === id);
  }

  static async create(input: Omit<StoredUser, "id" | "createdAt"> & { password: string }) {
    const users = storage.read<StoredUser[]>(USERS_KEY, []);
    if (this.list().some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
      return {
        error: { code: "EMAIL_EXISTS", message: "An account already uses this email." },
      } satisfies ServiceResult<User>;
    }
    const { password, ...safeInput } = input;
    const user: StoredUser = {
      ...safeInput,
      id: `user-${Date.now()}`,
      email: safeInput.email.toLowerCase(),
      fullName: sanitizeText(safeInput.fullName, 100),
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    storage.write(USERS_KEY, [...users, user]);
    return { data: user } satisfies ServiceResult<User>;
  }

  static updateContact(userId: string, input: { email?: string; mobile?: string }) {
    const users = storage.read<StoredUser[]>(USERS_KEY, []);
    const current = this.getById(userId);
    if (!current) return undefined;
    const next = {
      ...current,
      email: input.email?.trim().toLowerCase() || current.email,
      mobile: input.mobile?.trim() || current.mobile,
    };
    storage.write(
      USERS_KEY,
      users.some((user) => user.id === userId)
        ? users.map((user) => (user.id === userId ? next : user))
        : [next, ...users],
    );
    return next;
  }

  static updateRole(userId: string, role: "artist" | "gallery") {
    const users = storage.read<StoredUser[]>(USERS_KEY, []);
    const current = this.getById(userId);
    if (!current) return undefined;
    const next = { ...current, role } as StoredUser;
    storage.write(
      USERS_KEY,
      users.some((user) => user.id === userId)
        ? users.map((user) => (user.id === userId ? next : user))
        : [next, ...users],
    );
    return next;
  }
}

export class AuthService {
  static async login(
    email: string,
    password: string,
  ): Promise<ServiceResult<{ user: User; destination: string }>> {
    const normalized = email.trim().toLowerCase();
    const user = UserService.list().find((item) => item.email.toLowerCase() === normalized);
    if (!user)
      return {
        error: { code: "INVALID_CREDENTIALS", message: "The email or password is not correct." },
      };
    const submittedHash = await hashPassword(password);
    const expectedHash = user.passwordHash ?? SEEDED_PASSWORD_HASHES[normalized];
    if (!expectedHash || submittedHash !== expectedHash)
      return {
        error: { code: "INVALID_CREDENTIALS", message: "The email or password is not correct." },
      };
    const session: DemoSession = {
      userId: user.id,
      role: user.role,
      email: user.email,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    storage.write(SESSION_KEY, session, "session");
    const destination = ["artist", "gallery"].includes(user.role)
      ? SubscriptionService.destinationFor(user)
      : ROLE_HOME[user.role];
    return { data: { user, destination } };
  }

  static startSession(user: User) {
    storage.write<DemoSession>(
      SESSION_KEY,
      {
        userId: user.id,
        role: user.role,
        email: user.email,
        expiresAt: Date.now() + SESSION_DURATION_MS,
      },
      "session",
    );
  }

  static getSession() {
    const session = storage.read<DemoSession | null>(SESSION_KEY, null, "session");
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      storage.remove(SESSION_KEY, "session");
      return null;
    }
    return session;
  }

  static currentUser() {
    const session = this.getSession();
    return session ? (UserService.getById(session.userId) ?? null) : null;
  }

  static logout() {
    storage.remove(SESSION_KEY, "session");
  }

  static async requestPasswordReset(email: string) {
    const exists = UserService.list().some(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
    return { data: { accepted: true, exists } } satisfies ServiceResult<{
      accepted: boolean;
      exists: boolean;
    }>;
  }
}

export class ArtistService {
  static getStoreForUser(userId: string) {
    return StoreService.list().find((store) => store.ownerId === userId);
  }
}
export class StoreService {
  static list() {
    const stored = storage.read<Store[]>(STORES_KEY, []);
    return structuredClone([
      ...STORES,
      ...stored.filter((store) => !STORES.some((seed) => seed.id === store.id)),
    ]);
  }
  static getBySlug(slug: string) {
    return structuredClone(this.list().find((store) => store.slug === slug));
  }
  static save(store: Store) {
    const stored = storage.read<Store[]>(STORES_KEY, []);
    const next = stored.some((item) => item.id === store.id)
      ? stored.map((item) => (item.id === store.id ? store : item))
      : [store, ...stored];
    storage.write(STORES_KEY, next);
    return store;
  }
}
export class ArtworkService {
  static list(): Artwork[] {
    return storage.read<Artwork[]>(ARTWORKS_KEY, ARTWORKS);
  }
  static forStore(storeId: string) {
    return this.list().filter((artwork) => artwork.storeId === storeId);
  }
  static save(artwork: Artwork) {
    const items = this.list();
    const index = items.findIndex((item) => item.id === artwork.id);
    const next =
      index >= 0
        ? items.map((item) => (item.id === artwork.id ? artwork : item))
        : [artwork, ...items];
    storage.write(ARTWORKS_KEY, next);
    return artwork;
  }
  static updateMany(ids: string[], status: Artwork["status"]) {
    const next = this.list().map((item) => (ids.includes(item.id) ? { ...item, status } : item));
    storage.write(ARTWORKS_KEY, next);
    return next;
  }
  static deleteMany(ids: string[]) {
    const next = this.list().filter((item) => !ids.includes(item.id));
    storage.write(ARTWORKS_KEY, next);
    return next;
  }
}

export class ArtworkDraftService {
  static read<T>(fallback: T) {
    return storage.read<T>(ARTWORK_DRAFT_KEY, fallback);
  }

  static save<T>(value: T) {
    return storage.write(ARTWORK_DRAFT_KEY, value);
  }

  static clear() {
    storage.remove(ARTWORK_DRAFT_KEY);
  }
}
export class OrderService {
  static listFor(userId: string, role: UserRole) {
    return ORDERS.filter((order) =>
      role === "buyer" ? order.buyerId === userId : order.sellerId === userId,
    );
  }
}
export class MessageService {
  static conversationsFor(userId: string): Conversation[] {
    return CONVERSATIONS.filter((conversation) => conversation.participantIds.includes(userId));
  }
  static messagesFor(conversationId: string): Message[] {
    return MESSAGES.filter((message) => message.conversationId === conversationId);
  }
}
export class PromotionService {
  static list() {
    const stored = storage.read<Promotion[]>(PROMOTIONS_KEY, []);
    return structuredClone([
      ...stored,
      ...PROMOTIONS.filter((promotion) => !stored.some((item) => item.id === promotion.id)),
    ]);
  }

  static create(input: Omit<Promotion, "id">) {
    const promotion: Promotion = { ...input, id: `promo-${Date.now()}` };
    storage.write(PROMOTIONS_KEY, [promotion, ...storage.read<Promotion[]>(PROMOTIONS_KEY, [])]);
    return promotion;
  }
}
export class AdminService {
  static canAccess(user?: User | null) {
    return user?.role === "admin";
  }
}
const emptyFlow = (): ArtistFlowState => ({
  signupComplete: false,
  verificationComplete: false,
  paymentComplete: false,
  onboardingStep: 0,
  onboardingComplete: false,
  updatedAt: new Date().toISOString(),
});

const seededPlanByEmail: Record<string, PlanId> = {
  "free.artist@artdera.demo": "free",
  "professional.artist@artdera.demo": "professional",
  "pro.artist@artdera.demo": "pro-plus",
  "artist@artdera.demo": "professional",
  "gallery@artdera.demo": "gallery",
};

function addCycle(date: Date, cycle: BillingCycle) {
  const next = new Date(date);
  if (cycle === "annual") next.setFullYear(next.getFullYear() + 1);
  else if (cycle === "monthly") next.setMonth(next.getMonth() + 1);
  return next.toISOString();
}

export class PlanService {
  static list() {
    return structuredClone(Object.values(PLANS));
  }

  static get(planId: PlanId) {
    return structuredClone(PLANS[planId]);
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

export class SubscriptionService {
  static getFlow(): ArtistFlowState {
    return storage.read<ArtistFlowState>(FLOW_KEY, emptyFlow());
  }

  static saveFlow(patch: Partial<ArtistFlowState>) {
    const next = { ...this.getFlow(), ...patch, updatedAt: new Date().toISOString() };
    storage.write(FLOW_KEY, next);
    return next;
  }

  static selectPlan(planId: PlanId, requestedCycle?: BillingCycle): PlanSelection {
    const plan = PLANS[planId];
    const billingCycle = validBillingCycle(planId, requestedCycle);
    const selection: PlanSelection = {
      planId,
      billingCycle,
      price: planPrice(planId, billingCycle),
      commission: plan.commission,
      listingLimit: plan.listingLimit,
      features: [...plan.features],
      selectedAt: new Date().toISOString(),
    };
    this.saveFlow({ selection });
    return selection;
  }

  static getSelection() {
    return this.getFlow().selection;
  }

  static preferredBilling() {
    const value = this.getFlow().preferredBilling;
    return value === "annual" ? "annual" : "monthly";
  }

  static setPreferredBilling(value: "monthly" | "annual") {
    return this.saveFlow({ preferredBilling: value });
  }

  static attachUser(userId: string) {
    return this.saveFlow({ userId, signupComplete: true });
  }

  static markVerified(userId: string) {
    const selection = this.getSelection();
    const flow = this.saveFlow({ userId, verificationComplete: true });
    if (selection?.planId === "free") {
      this.activate(userId, "free", "free", "Active");
      return this.saveFlow({ paymentComplete: true, paymentStatus: "Succeeded" });
    }
    return flow;
  }

  static markPayment(status: Payment["status"]) {
    return this.saveFlow({ paymentStatus: status, paymentComplete: status === "Succeeded" });
  }

  static markOnboardingStep(step: number) {
    return this.saveFlow({ onboardingStep: Math.max(0, Math.min(7, step)) });
  }

  static confirmGalleryRegistration(userId: string) {
    return this.saveFlow({ userId, galleryRegistrationConfirmed: true });
  }

  static completeOnboarding(storeId: string) {
    return this.saveFlow({ onboardingStep: 7, onboardingComplete: true, storeId });
  }

  static destinationFor(user: User) {
    if (!["artist", "gallery"].includes(user.role)) return ROLE_HOME[user.role];
    const flow = this.getFlow();
    const subscription = this.getForUser(user.id);
    if (flow.userId === user.id) {
      if (!flow.verificationComplete) return "/artist/verify";
      if (!subscription) return "/sell/plans";
      if (subscription.planId !== "free" && subscription.status !== "Active")
        return "/artist/checkout";
      if (!flow.onboardingComplete) return "/artist/onboarding";
    }
    if (!subscription) return "/sell/plans";
    return "/artist/dashboard";
  }

  static list(): Subscription[] {
    return storage.read<Subscription[]>(SUBSCRIPTIONS_KEY, []);
  }

  static getForUser(userId: string): Subscription | undefined {
    const stored = this.list().find((subscription) => subscription.userId === userId);
    if (stored) return stored;
    const user = UserService.getById(userId);
    const planId = user ? seededPlanByEmail[user.email] : undefined;
    if (!planId) return undefined;
    const cycle: BillingCycle = planId === "free" ? "free" : "monthly";
    const plan = PLANS[planId];
    return {
      id: `sub-seed-${userId}`,
      userId,
      planId,
      billingCycle: cycle,
      status: "Active",
      startedAt: "2026-07-01T00:00:00.000Z",
      renewsAt: addCycle(new Date("2026-07-01T00:00:00.000Z"), cycle),
      price: planPrice(planId, cycle),
      commission: plan.commission,
      listingLimit: plan.listingLimit,
      featureIds: [...plan.allowedModules],
    };
  }

  static activate(
    userId: string,
    planId: PlanId,
    requestedCycle: BillingCycle,
    status: Subscription["status"] = "Active",
  ) {
    const plan = PLANS[planId];
    const billingCycle = validBillingCycle(planId, requestedCycle);
    const now = new Date();
    const existing = this.getForUser(userId);
    const subscription: Subscription = {
      id: existing?.id ?? `sub-${Date.now()}`,
      userId,
      planId,
      billingCycle,
      status,
      startedAt: existing?.startedAt ?? now.toISOString(),
      renewsAt: billingCycle === "free" ? undefined : addCycle(now, billingCycle),
      price: planPrice(planId, billingCycle),
      commission: plan.commission,
      listingLimit: plan.listingLimit,
      featureIds: [...plan.allowedModules],
    };
    const without = this.list().filter((item) => item.userId !== userId);
    storage.write(SUBSCRIPTIONS_KEY, [subscription, ...without]);
    this.saveFlow({ userId, selection: this.selectPlan(planId, billingCycle) });
    return subscription;
  }

  static updateStatus(userId: string, status: Subscription["status"]) {
    const current = this.getForUser(userId);
    if (!current) return undefined;
    const next = {
      ...current,
      status,
      cancelledAt: status === "Cancelled" ? new Date().toISOString() : undefined,
    };
    storage.write(SUBSCRIPTIONS_KEY, [
      next,
      ...this.list().filter((item) => item.userId !== userId),
    ]);
    return next;
  }

  static scheduleDowngrade(
    userId: string,
    toPlanId: PlanId,
    effective: PlanDowngrade["effective"],
  ) {
    const current = this.getForUser(userId);
    if (!current || PLAN_RANK[toPlanId] >= PLAN_RANK[current.planId]) return undefined;
    const effectiveAt =
      effective === "immediately"
        ? new Date().toISOString()
        : (current.renewsAt ?? addCycle(new Date(), current.billingCycle));
    const targetLimit = PLANS[toPlanId].listingLimit;
    const active = ArtworkService.list().filter((artwork) =>
      ["Published", "Pending Review", "Reserved"].includes(artwork.status),
    );
    const archivedArtworkIds =
      targetLimit === null ? [] : active.slice(targetLimit).map((artwork) => artwork.id);
    const change: PlanDowngrade = {
      id: `down-${Date.now()}`,
      userId,
      fromPlanId: current.planId,
      toPlanId,
      effective,
      effectiveAt,
      archivedArtworkIds,
      status: effective === "immediately" ? "Completed" : "Scheduled",
    };
    storage.write(DOWNGRADES_KEY, [change, ...storage.read<PlanDowngrade[]>(DOWNGRADES_KEY, [])]);
    if (effective === "immediately") {
      if (archivedArtworkIds.length) ArtworkService.updateMany(archivedArtworkIds, "Archived");
      this.activate(userId, toPlanId, toPlanId === "free" ? "free" : "monthly");
    } else {
      const next = { ...current, pendingPlanId: toPlanId, pendingChangeAt: effectiveAt };
      storage.write(SUBSCRIPTIONS_KEY, [
        next,
        ...this.list().filter((item) => item.userId !== userId),
      ]);
    }
    return change;
  }

  static planFor(role: UserRole): PlanId {
    return role === "gallery" ? "gallery" : role === "artist" ? "professional" : "free";
  }

  static planForUser(user: User): PlanId {
    return (
      this.getForUser(user.id)?.planId ?? (user as StoredUser).planId ?? this.planFor(user.role)
    );
  }
}

export class InvoiceService {
  static listFor(userId: string) {
    return storage.read<Invoice[]>(INVOICES_KEY, []).filter((invoice) => invoice.userId === userId);
  }

  static create(userId: string, subscription: Subscription, status: Invoice["status"] = "Paid") {
    const invoice: Invoice = {
      id: `INV-DEMO-${Date.now().toString().slice(-8)}`,
      userId,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      billingCycle: subscription.billingCycle,
      amount: subscription.price,
      tax: 0,
      discount: 0,
      total: subscription.price,
      status,
      issuedAt: new Date().toISOString(),
    };
    storage.write(INVOICES_KEY, [invoice, ...storage.read<Invoice[]>(INVOICES_KEY, [])]);
    return invoice;
  }
}

export class PaymentService {
  static listFor(userId: string) {
    return storage.read<Payment[]>(PAYMENTS_KEY, []).filter((payment) => payment.userId === userId);
  }

  static process(input: {
    userId: string;
    method: PaymentMethod;
    simulateFailure?: boolean;
    pendingReview?: boolean;
  }) {
    const selection = SubscriptionService.getSelection();
    if (!selection || selection.planId === "free") {
      return {
        error: { code: "NO_PAID_PLAN", message: "A paid plan is required for checkout." },
      } satisfies ServiceResult<Payment>;
    }
    const status: Payment["status"] = input.simulateFailure
      ? "Failed"
      : input.pendingReview
        ? "Pending Review"
        : "Succeeded";
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      userId: input.userId,
      planId: selection.planId,
      billingCycle: selection.billingCycle,
      method: input.method,
      amount: selection.price,
      status,
      reference: `AD-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      failureReason: status === "Failed" ? "Development failure simulation" : undefined,
    };
    let invoice: Invoice | undefined;
    if (status === "Succeeded" || status === "Pending Review") {
      const previousSubscription = SubscriptionService.getForUser(input.userId);
      const subscription = SubscriptionService.activate(
        input.userId,
        selection.planId,
        selection.billingCycle,
        status === "Succeeded" ? "Active" : "Payment Review",
      );
      invoice = InvoiceService.create(
        input.userId,
        subscription,
        status === "Succeeded" ? "Paid" : "Pending",
      );
      payment.invoiceId = invoice.id;
      if (
        status === "Succeeded" &&
        previousSubscription &&
        previousSubscription.planId !== selection.planId &&
        PLAN_RANK[selection.planId] > PLAN_RANK[previousSubscription.planId]
      ) {
        PlanChangeService.recordUpgrade(
          input.userId,
          previousSubscription.planId,
          selection.planId,
          payment.id,
        );
      }
      if (
        status === "Succeeded" &&
        selection.planId === "gallery" &&
        SubscriptionService.getFlow().galleryRegistrationConfirmed
      ) {
        UserService.updateRole(input.userId, "gallery");
      }
    }
    storage.write(PAYMENTS_KEY, [payment, ...storage.read<Payment[]>(PAYMENTS_KEY, [])]);
    SubscriptionService.markPayment(status);
    return { data: payment } satisfies ServiceResult<Payment>;
  }
}

export class VerificationService {
  static verify(userId: string, code: string) {
    if (code !== "123456") {
      return {
        error: { code: "INVALID_OTP", message: "That demo code is not correct." },
      } satisfies ServiceResult<{ verified: boolean }>;
    }
    SubscriptionService.markVerified(userId);
    return { data: { verified: true } } satisfies ServiceResult<{ verified: boolean }>;
  }
}

export class FeatureAccessService {
  static canAccess(planId: PlanId, module: string) {
    return PLANS[planId].allowedModules.includes(module);
  }

  static requiredPlan(module: string): PlanId {
    if (["managed-artists", "staff", "inventory", "exhibitions", "reports"].includes(module))
      return "gallery";
    if (["advanced-analytics", "customers", "premium-url", "international-tools"].includes(module))
      return "pro-plus";
    return "professional";
  }

  static usage(userId: string, storeId?: string): PlanUsage {
    const artworks = storeId ? ArtworkService.forStore(storeId) : [];
    return {
      userId,
      activeListings: artworks.filter((artwork) =>
        ["Published", "Pending Review", "Reserved"].includes(artwork.status),
      ).length,
      managedArtists: userId === "user-gallery" ? 3 : 0,
      staffAccounts: userId === "user-gallery" ? 3 : 0,
      exhibitionPages: userId === "user-gallery" ? 2 : 0,
      storageUsedMb: userId === "user-gallery" ? 1840 : 240,
    };
  }
}

export class PlanChangeService {
  static recordUpgrade(userId: string, fromPlanId: PlanId, toPlanId: PlanId, paymentId?: string) {
    const upgrade: PlanUpgrade = {
      id: `up-${Date.now()}`,
      userId,
      fromPlanId,
      toPlanId,
      effectiveAt: new Date().toISOString(),
      paymentId,
      status: "Completed",
    };
    storage.write(UPGRADES_KEY, [upgrade, ...storage.read<PlanUpgrade[]>(UPGRADES_KEY, [])]);
    return upgrade;
  }
}

export class OnboardingService {
  static read<T>(fallback: T): T {
    return storage.read<T>(ONBOARDING_KEY, fallback);
  }

  static save<T>(value: T, step?: number) {
    storage.write(ONBOARDING_KEY, value);
    if (typeof step === "number") SubscriptionService.markOnboardingStep(step);
  }

  static clear() {
    storage.remove(ONBOARDING_KEY);
  }
}

export class SignupProgressService {
  static read<T>(fallback: T): T {
    return storage.read<T>(SIGNUP_KEY, fallback);
  }

  static save<T>(value: T) {
    return storage.write(SIGNUP_KEY, value);
  }

  static clear() {
    storage.remove(SIGNUP_KEY);
  }
}

export function canAccessRole(user: User | null, roles: UserRole[]) {
  // Demo-only navigation guard. A production backend must enforce every role and resource check.
  return Boolean(user && roles.includes(user.role));
}
