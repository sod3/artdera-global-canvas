import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Archive,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  Eye,
  FileText,
  GalleryHorizontalEnd,
  Grid2X2,
  Heart,
  HelpCircle,
  ImagePlus,
  LayoutDashboard,
  List,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Package,
  PackageCheck,
  Palette,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  Truck,
  UserRoundCheck,
  Users,
  Video,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "./auth";
import {
  ANALYTICS,
  ARTWORKS,
  CUSTOMERS,
  EXHIBITIONS,
  MESSAGES,
  NOTIFICATIONS,
  ORDERS,
  PAYOUTS,
  PROMOTIONS,
  REVIEWS,
  SHIPMENTS,
  STAFF,
  STORES,
} from "./data";
import {
  ARTWORK_STATUSES,
  ORDER_STATUSES,
  type Artwork,
  type ArtworkStatus,
  type OrderStatus,
  type PlanId,
} from "./types";
import {
  ArtistService,
  ArtworkDraftService,
  ArtworkService,
  containsProtectedContact,
  FeatureAccessService,
  InvoiceService,
  PromotionService,
  StoreService,
  SubscriptionService,
} from "./services";
import { formatPKR, PLAN_ORDER, PLANS, PROMOTION_PLACEMENTS } from "./config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { IMAGES } from "@/lib/artdera";
import { PlanFeatureGate } from "@/components/marketplace/PlanFeatureGate";

const artistNavigation: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      ["Overview", "overview", LayoutDashboard],
      ["My Store", "store", Store],
      ["Artworks", "artworks", Palette],
      ["Add Artwork", "add-artwork", ImagePlus],
    ],
  },
  {
    label: "Sell",
    items: [
      ["Orders", "orders", ShoppingBag],
      ["Messages", "messages", MessageCircle],
      ["Customers", "customers", Users],
      ["Promotions", "promotions", Sparkles],
    ],
  },
  {
    label: "Business",
    items: [
      ["Analytics", "analytics", BarChart3],
      ["Shipping", "shipping", Truck],
      ["Payouts", "payouts", Banknote],
      ["Reviews", "reviews", Star],
    ],
  },
  {
    label: "Growth tools",
    items: [
      ["International Selling", "international-tools", Truck],
      ["Premium Store URL", "premium-url", Store],
    ],
  },
  {
    label: "Account",
    items: [
      ["Verification", "verification", BadgeCheck],
      ["Subscription & Billing", "billing", CreditCard],
      ["Support", "support", HelpCircle],
      ["Settings", "settings", Settings],
    ],
  },
];

const galleryNavigation: NavGroup = {
  label: "Gallery",
  items: [
    ["Managed Artists", "managed-artists", Users],
    ["Add Artist", "add-artist", Plus],
    ["Staff Accounts", "staff", UserRoundCheck],
    ["Staff Permissions", "staff-permissions", LockKeyhole],
    ["Inventory", "inventory", Boxes],
    ["Exhibitions", "exhibitions", GalleryHorizontalEnd],
    ["Gallery CRM", "gallery-crm", ClipboardCheck],
    ["Reports", "reports", FileText],
  ],
};
type NavItem = readonly [string, string, LucideIcon];
type NavGroup = { label: string; items: NavItem[] };

export function SellerDashboard({ section = "overview" }: { section?: string }) {
  const { user, ready, logout } = useAuth();
  const recoveryRoute = ready && user ? SubscriptionService.destinationFor(user) : null;

  useEffect(() => {
    if (recoveryRoute && recoveryRoute !== "/artist/dashboard") {
      window.location.replace(recoveryRoute);
    }
  }, [recoveryRoute]);

  if (!ready) return <DashboardLoading />;
  if (!user || !["artist", "gallery"].includes(user.role)) return <DashboardAccess />;
  if (recoveryRoute !== "/artist/dashboard") return <DashboardLoading />;
  const sellerRole = user.role as "artist" | "gallery";
  const groups =
    sellerRole === "gallery" ? [...artistNavigation, galleryNavigation] : artistNavigation;
  const store = ArtistService.getStoreForUser(user.id);
  const planId = SubscriptionService.planForUser(user);
  const subscription = SubscriptionService.getForUser(user.id);
  const title =
    groups.flatMap((group) => group.items).find((item) => item[1] === section)?.[0] ?? "Overview";
  return (
    <div className="min-h-[calc(100vh-var(--header-height))] bg-[#f2ede4]">
      <div className="container-editorial py-5 lg:py-7">
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] px-4 py-3 lg:hidden">
          <div>
            <div className="text-xs text-muted-foreground">Seller dashboard</div>
            <div className="font-semibold">{title}</div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border"
                aria-label="Open dashboard navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-[var(--ink)] p-0 text-[var(--ivory)]">
              <SheetHeader className="sr-only">
                <SheetTitle>Seller dashboard navigation</SheetTitle>
              </SheetHeader>
              <DashboardNavigation
                groups={groups}
                section={section}
                userName={user.fullName}
                storeName={store?.name ?? "Your store"}
                logout={logout}
                planId={planId}
                subscriptionStatus={subscription?.status ?? "Active"}
              />
            </SheetContent>
          </Sheet>
        </div>
        <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="sticky top-[calc(var(--header-height)+1.5rem)] hidden h-[calc(100vh-var(--header-height)-3rem)] overflow-hidden rounded-2xl bg-[var(--ink)] text-[var(--ivory)] lg:block">
            <DashboardNavigation
              groups={groups}
              section={section}
              userName={user.fullName}
              storeName={store?.name ?? "Your store"}
              logout={logout}
              planId={planId}
              subscriptionStatus={subscription?.status ?? "Active"}
            />
          </aside>
          <main className="min-w-0">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="eyebrow">
                  {sellerRole === "gallery" ? "Gallery workspace" : "Artist workspace"}
                </div>
                <h1 className="mt-2 font-display text-4xl md:text-5xl">{title}</h1>
              </div>
              <div className="flex gap-2">
                <a href="/artist/dashboard/subscription" className="chip min-h-11 !px-4">
                  {PLANS[planId].name} · {subscription?.status ?? "Active"}
                </a>
                <a
                  href={store ? `/store/${store.slug}` : "/artist/onboarding"}
                  className="btn-ghost"
                >
                  <Eye className="h-4 w-4" /> {store ? "View Store" : "Create Store"}
                </a>
                <NotificationBell userId={user.id} />
              </div>
            </div>
            <DashboardSection
              section={section}
              userId={user.id}
              role={sellerRole}
              storeId={store?.id ?? `unpublished-${user.id}`}
              storeSlug={store?.slug ?? "unpublished-store"}
              planId={planId}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

function DashboardNavigation({
  groups,
  section,
  userName,
  storeName,
  logout,
  planId,
  subscriptionStatus,
}: {
  groups: NavGroup[];
  section: string;
  userName: string;
  storeName: string;
  logout: () => void;
  planId: PlanId;
  subscriptionStatus: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-5">
        <div className="eyebrow !text-white/42">Seller centre</div>
        <div className="mt-2 truncate font-display text-2xl">{storeName}</div>
        <div className="mt-1 truncate text-xs text-white/45">{userName}</div>
        <a
          href="/artist/dashboard/subscription"
          className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/75"
        >
          {PLANS[planId].name} · {subscriptionStatus}
        </a>
      </div>
      <nav
        className="no-scrollbar flex-1 space-y-6 overflow-y-auto p-3"
        aria-label="Seller dashboard"
      >
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
              {group.label}
            </div>
            <div className="grid gap-0.5">
              {group.items.map(([label, slug, Icon]) => {
                const accessModule = slug === "billing" ? "subscription" : slug;
                const locked = !FeatureAccessService.canAccess(planId, accessModule);
                const required = locked
                  ? FeatureAccessService.requiredPlan(accessModule)
                  : undefined;
                const href =
                  slug === "overview"
                    ? "/artist/dashboard"
                    : slug === "add-artwork"
                      ? "/artist/dashboard/artworks/new"
                      : slug === "billing"
                        ? "/artist/dashboard/subscription"
                        : `/artist/dashboard/${slug}`;
                return (
                  <a
                    key={slug}
                    href={href}
                    className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-xs font-semibold transition ${section === slug ? "bg-[var(--terracotta)] text-[var(--ink)]" : "text-white/66 hover:bg-white/8 hover:text-white"}`}
                  >
                    {locked ? <LockKeyhole className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {required && (
                      <span className="text-[9px] opacity-65">{PLANS[required].name}</span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => {
            logout();
            window.location.href = "/";
          }}
          className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold text-white/60 hover:bg-white/8 hover:text-white"
        >
          <LockKeyhole className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );
}

function DashboardSection(props: {
  section: string;
  userId: string;
  role: "artist" | "gallery";
  storeId: string;
  storeSlug: string;
  planId: PlanId;
}) {
  switch (props.section) {
    case "overview":
      return <Overview {...props} />;
    case "store":
      return <StoreManager storeId={props.storeId} storeSlug={props.storeSlug} />;
    case "artworks":
      return <ArtworkManager storeId={props.storeId} />;
    case "inventory":
      return (
        <GalleryFeatureGate {...props} module="inventory" featureName="Gallery inventory">
          <ArtworkManager storeId={props.storeId} />
        </GalleryFeatureGate>
      );
    case "add-artwork":
      return <AddArtwork storeId={props.storeId} planId={props.planId} />;
    case "orders":
      return <OrdersManager />;
    case "messages":
      return <MessageCenter />;
    case "customers":
      return (
        <PlanFeatureGate
          requiredPlan="pro-plus"
          currentPlan={props.planId}
          featureName="Customer-management tools"
          upgradeDescription="Organise collectors, consent-aware follow-ups and completed-order relationships with Pro Plus customer tools."
          upgradeTarget="pro-plus"
          module="customers"
        >
          <Customers planId={props.planId} />
        </PlanFeatureGate>
      );
    case "gallery-crm":
      return (
        <GalleryFeatureGate {...props} module="gallery-crm" featureName="Gallery CRM">
          <Customers planId={props.planId} />
        </GalleryFeatureGate>
      );
    case "analytics":
      return <Analytics planId={props.planId} />;
    case "international-tools":
      return (
        <PlanFeatureGate
          requiredPlan="pro-plus"
          currentPlan={props.planId}
          featureName="International selling tools"
          upgradeDescription="Pro Plus adds international buyer enquiries, region-aware shipping settings and cross-border sales preparation."
          upgradeTarget="pro-plus"
          module="international-tools"
        >
          <UnlockedGrowthTool
            title="International selling tools"
            body="Configure international enquiry regions, customs notes and cross-border shipping preparation from this workspace."
          />
        </PlanFeatureGate>
      );
    case "premium-url":
      return (
        <PlanFeatureGate
          requiredPlan="pro-plus"
          currentPlan={props.planId}
          featureName="Premium artist store URL"
          upgradeDescription="Pro Plus unlocks premium store URL controls alongside advanced analytics and customer-management tools."
          upgradeTarget="pro-plus"
          module="premium-url"
        >
          <UnlockedGrowthTool
            title="Premium store URL"
            body={`Your premium URL can be configured for artdera.com/store/${props.storeSlug}. Domain connection remains a backend integration.`}
          />
        </PlanFeatureGate>
      );
    case "promotions":
      return <Promotions />;
    case "shipping":
      return <Shipping />;
    case "payouts":
      return <Payouts planId={props.planId} />;
    case "reviews":
      return <Reviews />;
    case "verification":
      return <Verification />;
    case "billing":
      return <Billing planId={props.planId} userId={props.userId} role={props.role} />;
    case "support":
      return <Support planId={props.planId} />;
    case "settings":
      return <SettingsPage />;
    case "managed-artists":
    case "add-artist":
      return (
        <GalleryFeatureGate {...props} module={props.section} featureName="Artist management">
          <ManagedArtists />
        </GalleryFeatureGate>
      );
    case "staff":
    case "staff-permissions":
      return (
        <GalleryFeatureGate {...props} module={props.section} featureName="Gallery staff accounts">
          <StaffAccounts />
        </GalleryFeatureGate>
      );
    case "exhibitions":
      return (
        <GalleryFeatureGate {...props} module="exhibitions" featureName="Exhibition pages">
          <Exhibitions />
        </GalleryFeatureGate>
      );
    case "reports":
      return (
        <GalleryFeatureGate {...props} module="reports" featureName="Gallery reports">
          <GalleryReports />
        </GalleryFeatureGate>
      );
    default:
      return <Overview {...props} />;
  }
}

function GalleryFeatureGate({
  role,
  planId,
  module,
  featureName,
  children,
}: {
  role: "artist" | "gallery";
  planId: PlanId;
  module: string;
  featureName: string;
  children: ReactNode;
}) {
  return (
    <PlanFeatureGate
      requiredPlan="gallery"
      currentPlan={planId}
      featureName={featureName}
      upgradeDescription="Gallery adds staff permissions, managed artists, fair-use inventory, exhibition pages, CRM and advanced gallery reporting."
      upgradeTarget="gallery"
      module={module}
      forceLocked={role !== "gallery"}
    >
      {children}
    </PlanFeatureGate>
  );
}

function Overview({
  role,
  userId,
  storeId,
  storeSlug,
  planId,
}: {
  role: "artist" | "gallery";
  userId: string;
  storeId: string;
  storeSlug: string;
  planId: PlanId;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const subscription = SubscriptionService.getForUser(userId);
  const usage = FeatureAccessService.usage(userId, storeId);
  const storeArtworks = ArtworkService.forStore(storeId);
  const published = storeArtworks.filter((item) => item.status === "Published").length;
  const drafts = storeArtworks.filter((item) => item.status === "Draft").length;
  const sold = storeArtworks.filter((item) => item.status === "Sold").length;
  const metrics = [
    [
      "Total artworks",
      String(storeArtworks.length),
      `${published} published · ${drafts} drafts · ${sold} sold`,
      Palette,
    ],
    ["Orders", "12", "2 need attention", ShoppingBag],
    ["Store views", "8,420", "+18.4%", Eye],
    ["Wishlist saves", "486", "+32 this week", Heart],
    ["Messages", "24", "4 unread", MessageCircle],
    ["Estimated earnings", "Rs. 386k", "Rs. 82k pending", Banknote],
    ["Active promotions", "1", "6,840 impressions", Sparkles],
    [
      "Listing usage",
      role === "gallery"
        ? String(usage.activeListings)
        : `${usage.activeListings} / ${PLANS[planId].listingLimit}`,
      role === "gallery"
        ? "Fair-use active"
        : `${Math.round((usage.activeListings / (PLANS[planId].listingLimit || 1)) * 100)}% used`,
      Boxes,
    ],
  ] as const;
  const checklist = [
    ["profile", "Add profile picture", true],
    ["bio", "Complete biography", true],
    ["artwork", "Add first artwork", true],
    ["shipping", "Set shipping preferences", true],
    ["verification", "Submit verification", true],
    ["publish", "Publish store", true],
  ] as const;
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-[var(--indigo)] p-6 text-[var(--ivory)] md:p-8">
        <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="eyebrow !text-white/45">Welcome back</div>
            <h2 className="mt-3 font-display text-4xl">
              Your {PLANS[planId].name} workspace is ready.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/62">
              {PLANS[planId].listingLimit === null
                ? "Manage artists, staff, inventory and exhibitions from one gallery workspace with 0% ArtDera sales commission."
                : `You can publish ${PLANS[planId].listingLimit} active artworks with ${PLANS[planId].commission}% ArtDera sales commission.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/artist/dashboard/artworks/new"
              className="btn-primary bg-[var(--terracotta)] !text-[var(--ink)]"
            >
              <Plus className="h-4 w-4" /> Add Artwork
            </a>
            <a href={`/store/${storeSlug}`} className="btn-ghost !border-white/20 !text-white">
              View Store
            </a>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/10 px-3 py-2">
            <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-300" /> Store published
          </span>
          <span className="rounded-full bg-white/10 px-3 py-2">
            <BadgeCheck className="mr-1 inline h-3.5 w-3.5 text-[var(--terracotta)]" /> Verification
            Pending Review
          </span>
          <span className="rounded-full bg-white/10 px-3 py-2">
            {PLANS[planId].name} plan · {subscription?.status ?? "Active"}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-2 capitalize">
            {subscription?.billingCycle ?? "monthly"} billing
          </span>
          <span className="rounded-full bg-white/10 px-3 py-2">
            Payout: {PLANS[planId].payoutTime}
          </span>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, detail, Icon], index) => (
          <article
            key={label}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5"
          >
            <div className="flex items-start justify-between">
              <div className="text-xs font-semibold text-muted-foreground">{label}</div>
              <Icon className="h-4 w-4 text-[var(--oxblood)]" />
            </div>
            <div className="mt-3 font-display text-3xl">{value}</div>
            <div
              className={`mt-1 flex items-center gap-1 text-xs ${index === 2 || index === 3 ? "text-[var(--success)]" : "text-muted-foreground"}`}
            >
              {index === 2 || index === 3 ? <ArrowUpRight className="h-3 w-3" /> : null}
              {detail}
            </div>
          </article>
        ))}
      </section>
      {role === "gallery" && (
        <section className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Active artworks", usage.activeListings],
            ["Managed artists", usage.managedArtists],
            ["Staff accounts used", `${usage.staffAccounts} / 10`],
            ["Exhibition pages", usage.exhibitionPages],
            ["Storage usage", `${(usage.storageUsedMb / 1024).toFixed(1)} GB`],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl bg-[var(--ivory)] p-4">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-2 font-display text-2xl">{value}</div>
            </div>
          ))}
        </section>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow">Store activity</div>
              <h3 className="mt-2 font-display text-3xl">Views this week</h3>
            </div>
            <a href="/artist/dashboard/analytics" className="text-xs font-semibold underline">
              Full analytics
            </a>
          </div>
          <div className="mt-5 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYTICS}>
                <defs>
                  <linearGradient id="dashboardViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6e2334" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6e2334" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd4c7" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => value.slice(8)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} width={35} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="storeViews"
                  stroke="#6e2334"
                  strokeWidth={2}
                  fill="url(#dashboardViews)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5 md:p-6">
          <div className="eyebrow">Setup checklist</div>
          <h3 className="mt-2 font-display text-3xl">Your store is complete.</h3>
          <div className="mt-5 space-y-2">
            {checklist
              .filter(([id]) => !dismissed.includes(id))
              .map(([id, label, done]) => (
                <div
                  key={id}
                  className="flex min-h-11 items-center gap-3 rounded-xl bg-[var(--ivory)] px-3 text-sm"
                >
                  <CheckCircle2
                    className={`h-4 w-4 ${done ? "text-[var(--success)]" : "text-muted-foreground"}`}
                  />
                  <span className="flex-1">{label}</span>
                  <button
                    type="button"
                    onClick={() => setDismissed((values) => [...values, id])}
                    aria-label={`Dismiss ${label}`}
                    className="p-2 text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
          </div>
        </section>
      </div>
      <section className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5 sm:grid-cols-2 xl:grid-cols-7">
        {[
          ["Add Artwork", "/artist/dashboard/artworks/new", ImagePlus],
          ["View Store", `/store/${storeSlug}`, Eye],
          ["Edit Store", "/artist/dashboard/store", Pencil],
          ["Promote Artwork", "/artist/dashboard/promotions", Sparkles],
          ["View Messages", "/artist/dashboard/messages", MessageCircle],
          ["View Orders", "/artist/dashboard/orders", ShoppingBag],
          ["Manage Subscription", "/artist/dashboard/subscription", CreditCard],
        ].map(([label, href, Icon]) => {
          const ActionIcon = Icon as LucideIcon;
          return (
            <a
              key={label as string}
              href={href as string}
              className="flex min-h-20 flex-col justify-between rounded-xl bg-[var(--ivory)] p-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <ActionIcon className="h-5 w-5 text-[var(--oxblood)]" />
              {label as string}
            </a>
          );
        })}
      </section>
      <PlanUpgradeCard planId={planId} role={role} />
    </div>
  );
}

function UnlockedGrowthTool({ title, body }: { title: string; body: string }) {
  return (
    <Panel>
      <div className="eyebrow">Unlocked with your plan</div>
      <h2 className="mt-3 font-display text-4xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{body}</p>
      <button
        type="button"
        onClick={() => toast.success(`${title} settings saved in demo mode`)}
        className="btn-primary mt-6"
      >
        Save Demo Settings
      </button>
    </Panel>
  );
}

function PlanUpgradeCard({ planId, role }: { planId: PlanId; role: "artist" | "gallery" }) {
  const content =
    planId === "free"
      ? {
          title: "Grow Your Art Business",
          body: "Upgrade to Professional to add up to 50 artworks, access detailed analytics, receive priority support and build a stronger professional profile.",
          action: "Upgrade to Professional",
          target: "professional",
        }
      : planId === "professional"
        ? {
            title: "Unlock Advanced Growth Tools",
            body: "Upgrade to Pro Plus for 200 artwork listings, advanced analytics, international buyer tools, a premium store URL and customer-management features.",
            action: "Upgrade to Pro Plus",
            target: "pro-plus",
          }
        : planId === "pro-plus"
          ? {
              title: "Managing multiple artists and staff?",
              body: "Explore the Gallery Plan for managed artists, staff permissions, inventory, exhibitions, CRM and gallery reports. Your account is never converted automatically.",
              action: "Compare Gallery Plan",
              target: "gallery",
            }
          : {
              title: "Enterprise gallery support",
              body: "If your gallery reaches a fair-use or staff limit, contact ArtDera for an Enterprise Gallery Plan tailored to your programme.",
              action: "Request Enterprise Plan",
              target: "enterprise",
            };
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-6 md:p-8">
      <div className="eyebrow">{role === "gallery" ? "Gallery growth" : "Plan guidance"}</div>
      <h2 className="mt-3 font-display text-4xl">{content.title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.body}</p>
      <a
        href={
          content.target === "enterprise"
            ? "/artist/dashboard/support?topic=enterprise"
            : `/artist/dashboard/subscription?upgrade=${content.target}`
        }
        className="btn-primary mt-6"
      >
        {content.action}
      </a>
    </section>
  );
}

function ArtworkManager({ storeId }: { storeId: string }) {
  const [items, setItems] = useState(() =>
    ArtworkService.forStore(storeId).length
      ? ArtworkService.forStore(storeId)
      : ARTWORKS.slice(0, 4),
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const filtered = useMemo(
    () =>
      items
        .filter(
          (item) =>
            (!query ||
              `${item.title} ${item.category} ${item.medium}`
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (status === "All" || item.status === status),
        )
        .sort((a, b) =>
          sort === "Price: high"
            ? b.price - a.price
            : sort === "Price: low"
              ? a.price - b.price
              : b.year - a.year,
        ),
    [items, query, sort, status],
  );
  const pageItems = filtered.slice((page - 1) * 6, page * 6);
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  function bulk(nextStatus: ArtworkStatus) {
    if (!selected.length) return toast.error("Select at least one artwork.");
    const all = ArtworkService.updateMany(selected, nextStatus);
    const relevant = all.filter((item) => item.storeId === storeId);
    setItems(
      relevant.length
        ? relevant
        : items.map((item) =>
            selected.includes(item.id) ? { ...item, status: nextStatus } : item,
          ),
    );
    setSelected([]);
    toast.success(`${selected.length} artwork${selected.length === 1 ? "" : "s"} updated`);
  }
  function remove() {
    ArtworkService.deleteMany(selected);
    setItems((values) => values.filter((item) => !selected.includes(item.id)));
    setSelected([]);
    setConfirmDelete(false);
    toast.success("Artwork removed", {
      action: { label: "Undo", onClick: () => window.location.reload() },
    });
  }
  return (
    <Panel>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search title, category or medium"
              className="art-field pl-11"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="art-field !w-auto"
            >
              {["All", ...ARTWORK_STATUSES].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="art-field !w-auto"
            >
              <option>Newest</option>
              <option>Price: high</option>
              <option>Price: low</option>
            </select>
            <div className="flex rounded-full border border-[var(--color-border)] p-1">
              <button
                onClick={() => setView("grid")}
                className={`rounded-full p-2 ${view === "grid" ? "bg-[var(--ink)] text-white" : ""}`}
                aria-label="Grid view"
              >
                <Grid2X2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("table")}
                className={`rounded-full p-2 ${view === "table" ? "bg-[var(--ink)] text-white" : ""}`}
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--ivory)] p-3 text-xs">
            <strong className="mr-2">{selected.length} selected</strong>
            <button onClick={() => bulk("Published")} className="chip">
              Publish
            </button>
            <button onClick={() => bulk("Draft")} className="chip">
              Unpublish
            </button>
            <button onClick={() => bulk("Archived")} className="chip">
              Archive
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="chip !bg-red-50 !text-red-800"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        )}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                pageItems.length > 0 && pageItems.every((item) => selected.includes(item.id))
              }
              onChange={(event) =>
                setSelected(
                  event.target.checked
                    ? [...new Set([...selected, ...pageItems.map((item) => item.id)])]
                    : selected.filter((id) => !pageItems.some((item) => item.id === id)),
                )
              }
              className="accent-[var(--oxblood)]"
            />{" "}
            Select this page
          </label>
          <span>{filtered.length} artworks</span>
        </div>
        {pageItems.length === 0 ? (
          <EmptyState
            icon={Palette}
            title="No artworks match those filters."
            body="Clear a filter or add a new artwork to your store."
            action={["Add Artwork", "/artist/dashboard/artworks/new"]}
          />
        ) : view === "grid" ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((item) => (
              <ArtworkCard
                key={item.id}
                item={item}
                selected={selected.includes(item.id)}
                onSelect={(checked) =>
                  setSelected((values) =>
                    checked ? [...values, item.id] : values.filter((id) => id !== item.id),
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs text-muted-foreground">
                  <th className="p-3">Select</th>
                  <th className="p-3">Artwork</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Views</th>
                  <th className="p-3">Saves</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--color-border)]">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={(event) =>
                          setSelected((values) =>
                            event.target.checked
                              ? [...values, item.id]
                              : values.filter((id) => id !== item.id),
                          )
                        }
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.images[0].url}
                          alt=""
                          className="h-14 w-12 rounded object-cover"
                        />
                        <div>
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.medium}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{formatPKR(item.price)}</td>
                    <td className="p-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="p-3">{item.views}</td>
                    <td className="p-3">{item.saves}</td>
                    <td className="p-3">
                      <button className="btn-ghost px-3">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="btn-ghost px-3 disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pages}
          </span>
          <button
            disabled={page === pages}
            onClick={() => setPage((value) => Math.min(pages, value + 1))}
            className="btn-ghost px-3 disabled:opacity-35"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="bg-[var(--porcelain)]">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl">Delete selected artwork?</DialogTitle>
            <DialogDescription>
              This removes {selected.length} demo record{selected.length === 1 ? "" : "s"}. This
              action requires confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={remove} className="btn-primary !bg-[var(--destructive)]">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

function ArtworkCard({
  item,
  selected,
  onSelect,
}: {
  item: Artwork;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-[var(--porcelain)] ${selected ? "border-[var(--oxblood)] ring-1 ring-[var(--oxblood)]" : "border-[var(--color-border)]"}`}
    >
      <div className="relative">
        <img
          src={item.images[0].url}
          alt={item.images[0].alt}
          className="aspect-[4/3] w-full object-cover"
        />
        {item.sponsored && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--porcelain)] px-2 py-1 text-[10px] font-bold">
            Sponsored
          </span>
        )}
        <label className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--porcelain)] shadow-sm">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelect(event.target.checked)}
            className="accent-[var(--oxblood)]"
          />
          <span className="sr-only">Select {item.title}</span>
        </label>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl">{item.title}</h3>
            <div className="mt-1 text-xs text-muted-foreground">{formatPKR(item.price)}</div>
          </div>
          <StatusBadge status={item.status} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
          <span>
            <Eye className="mr-1 inline h-3 w-3" />
            {item.views}
          </span>
          <span>
            <Heart className="mr-1 inline h-3 w-3" />
            {item.saves}
          </span>
          <span>
            <MessageCircle className="mr-1 inline h-3 w-3" />
            {item.messages}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn-ghost flex-1 px-3">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <a href={`/product/${item.slug}`} className="btn-ghost flex-1 px-3">
            <Eye className="h-3.5 w-3.5" /> Preview
          </a>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full border"
            aria-label="More artwork actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function AddArtwork({ storeId, planId }: { storeId: string; planId: PlanId }) {
  const listingCount = ArtworkService.forStore(storeId).filter((item) =>
    ["Published", "Pending Review", "Reserved"].includes(item.status),
  ).length;
  const limit = PLANS[planId].listingLimit;
  const atLimit = limit !== null && listingCount >= limit;
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState("Not saved yet");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Original Works",
    medium: "Acrylic on canvas",
    style: "Contemporary",
    subject: "Abstract",
    year: "2026",
    kind: "Original" as Artwork["kind"],
    price: "",
    discount: "",
    quantity: "1",
    width: "60",
    height: "76",
    depth: "3",
    weight: "2.5",
    framed: false,
    domestic: true,
    international: false,
    certificate: true,
    tags: "abstract, contemporary",
    status: "Draft" as ArtworkStatus,
  });
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      ArtworkDraftService.save(form);
      setSaved(
        `Autosaved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      );
    }, 900);
    return () => window.clearTimeout(timer);
  }, [dirty, form]);
  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }
  function submit(event: FormEvent, status: ArtworkStatus) {
    event.preventDefault();
    if (atLimit && status !== "Draft")
      return toast.error(
        `You have used all ${limit} active listings included in the ${PLANS[planId].name} Plan. Save as draft, manage existing artworks or upgrade your plan.`,
      );
    if (!form.title || !Number(form.price))
      return toast.error("Add a title and valid price before saving.");
    const artwork: Artwork = {
      id: `art-${Date.now()}`,
      storeId,
      creatorName: "Your Studio",
      slug: form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      title: form.title,
      description: form.description,
      category: form.category,
      medium: form.medium,
      style: form.style,
      subject: form.subject,
      year: Number(form.year),
      kind: form.kind,
      price: Number(form.price),
      discountPrice: form.discount ? Number(form.discount) : undefined,
      dimensions: `${form.width} × ${form.height} × ${form.depth} cm`,
      weightKg: Number(form.weight),
      framed: form.framed,
      orientation: Number(form.width) > Number(form.height) ? "Landscape" : "Portrait",
      images: [{ id: `image-${Date.now()}`, url: IMAGES.art1, alt: form.title, isPrimary: true }],
      status,
      quantity: Number(form.quantity),
      domesticShipping: form.domestic,
      internationalShipping: form.international,
      certificate: form.certificate,
      tags: form.tags
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      customOrders: false,
      views: 0,
      saves: 0,
      messages: 0,
      sponsored: false,
    };
    ArtworkService.save(artwork);
    setDirty(false);
    toast.success(status === "Draft" ? "Artwork saved as draft" : "Artwork sent for review", {
      description: "You can keep editing it from Artworks.",
    });
  }
  return (
    <form onSubmit={(event) => submit(event, "Pending Review")} className="space-y-5">
      {atLimit && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-display text-2xl">Your active listing space is full.</h2>
              <p className="mt-2 text-sm leading-relaxed">
                You have used all {limit} active listings included in the {PLANS[planId].name}
                Plan. Nothing will be deleted. You can still complete this form and save it as a
                draft.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="/artist/dashboard/subscription" className="btn-primary">
                  Upgrade Plan
                </a>
                <a href="/artist/dashboard/artworks" className="btn-ghost">
                  Manage Existing Artworks
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--porcelain)] p-4 sm:flex-row sm:items-center">
        <div>
          <div className="text-sm font-semibold">
            {listingCount} of {limit ?? "fair-use unlimited"} active listings
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{saved}</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(event) => submit(event as unknown as FormEvent, "Draft")}
            className="btn-ghost"
          >
            Save draft
          </button>
          <button
            disabled={atLimit}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-45"
          >
            Preview and publish
          </button>
        </div>
      </div>
      <FormSection
        title="Basic information"
        description="Help buyers understand the work at a glance."
      >
        <FormGrid>
          <DashboardField label="Artwork title">
            <input
              className="art-field"
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
            />
          </DashboardField>
          <DashboardField label="Year created">
            <input
              type="number"
              className="art-field"
              value={form.year}
              onChange={(event) => set("year", event.target.value)}
            />
          </DashboardField>
          <DashboardField label="Description" wide>
            <textarea
              rows={5}
              className="art-field !rounded-xl"
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </DashboardField>
          <DashboardField label="Category">
            <input
              className="art-field"
              value={form.category}
              onChange={(event) => set("category", event.target.value)}
            />
          </DashboardField>
          <DashboardField label="Medium">
            <input
              className="art-field"
              value={form.medium}
              onChange={(event) => set("medium", event.target.value)}
            />
          </DashboardField>
          <DashboardField label="Style">
            <input
              className="art-field"
              value={form.style}
              onChange={(event) => set("style", event.target.value)}
            />
          </DashboardField>
          <DashboardField label="Subject">
            <input
              className="art-field"
              value={form.subject}
              onChange={(event) => set("subject", event.target.value)}
            />
          </DashboardField>
        </FormGrid>
      </FormSection>
      <FormSection
        title="Images and video"
        description="Demo uploads accept artwork images later; a safe project asset is used for this listing preview."
      >
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <img
            src={IMAGES.art1}
            alt="Artwork upload preview"
            className="aspect-[4/5] w-full rounded-xl object-cover"
          />
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border-strong)] text-center">
            <ImagePlus className="h-6 w-6 text-[var(--oxblood)]" />
            <span className="mt-3 text-sm font-semibold">Add main image</span>
            <span className="mt-1 text-xs text-muted-foreground">
              JPG, PNG or WebP · up to 5 MB
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" />
          </label>
        </div>
      </FormSection>
      <FormSection
        title="Pricing and inventory"
        description="Set one clear price and the available quantity."
      >
        <FormGrid>
          <DashboardField label="Price (Rs.)">
            <input
              inputMode="numeric"
              className="art-field"
              value={form.price}
              onChange={(event) => set("price", event.target.value.replace(/\D/g, ""))}
            />
          </DashboardField>
          <DashboardField label="Discount price, optional">
            <input
              inputMode="numeric"
              className="art-field"
              value={form.discount}
              onChange={(event) => set("discount", event.target.value.replace(/\D/g, ""))}
            />
          </DashboardField>
          <DashboardField label="Original or print">
            <select
              className="art-field"
              value={form.kind}
              onChange={(event) => set("kind", event.target.value as Artwork["kind"])}
            >
              <option>Original</option>
              <option>Print</option>
              <option>Limited Edition</option>
            </select>
          </DashboardField>
          <DashboardField label="Quantity">
            <input
              type="number"
              min="1"
              className="art-field"
              value={form.quantity}
              onChange={(event) => set("quantity", event.target.value)}
            />
          </DashboardField>
        </FormGrid>
      </FormSection>
      <FormSection
        title="Size, framing and shipping"
        description="Accurate dimensions produce better shipping estimates."
      >
        <FormGrid>
          {(
            [
              ["width", "Width (cm)"],
              ["height", "Height (cm)"],
              ["depth", "Depth (cm)"],
              ["weight", "Weight (kg)"],
            ] as const
          ).map(([key, label]) => (
            <DashboardField key={key} label={label}>
              <input
                type="number"
                step="0.1"
                className="art-field"
                value={form[key]}
                onChange={(event) => set(key, event.target.value)}
              />
            </DashboardField>
          ))}
          <DashboardToggle
            label="Framed"
            checked={form.framed}
            onChange={(value) => set("framed", value)}
          />
          <DashboardToggle
            label="Domestic shipping"
            checked={form.domestic}
            onChange={(value) => set("domestic", value)}
          />
          <DashboardToggle
            label="International shipping"
            checked={form.international}
            onChange={(value) => set("international", value)}
          />
          <DashboardToggle
            label="Certificate of authenticity"
            checked={form.certificate}
            onChange={(value) => set("certificate", value)}
          />
        </FormGrid>
      </FormSection>
      <FormSection
        title="Search tags and review"
        description="Use specific, accurate words separated by commas."
      >
        <DashboardField label="Search tags">
          <input
            className="art-field"
            value={form.tags}
            onChange={(event) => set("tags", event.target.value)}
          />
        </DashboardField>
        <div className="mt-5 grid gap-4 rounded-xl bg-[var(--ivory)] p-4 sm:grid-cols-[100px_1fr]">
          <img
            src={IMAGES.art1}
            alt="Listing preview"
            className="aspect-[4/5] w-full rounded-lg object-cover"
          />
          <div>
            <div className="eyebrow">Listing preview</div>
            <div className="mt-2 font-display text-2xl">{form.title || "Untitled artwork"}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {form.medium} · {form.width} × {form.height} cm
            </div>
            <div className="mt-3 font-semibold">
              {form.price ? formatPKR(Number(form.price)) : "Add a price"}
            </div>
          </div>
        </div>
      </FormSection>
    </form>
  );
}

function StoreManager({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const store = StoreService.list().find((item) => item.id === storeId) ?? STORES[0];
  const [tagline, setTagline] = useState(store.tagline);
  const [bio, setBio] = useState(store.bio);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Panel>
        <div className="eyebrow">Store details</div>
        <h2 className="mt-2 font-display text-3xl">Edit the story buyers see.</h2>
        <div className="mt-6 grid gap-5">
          <DashboardField label="Store name">
            <input className="art-field" defaultValue={store.name} />
          </DashboardField>
          <DashboardField label="Store URL">
            <div className="art-field bg-[var(--ivory)] text-muted-foreground">
              artdera.com/store/{store.slug}
            </div>
          </DashboardField>
          <DashboardField label="Tagline">
            <input
              className="art-field"
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
            />
          </DashboardField>
          <DashboardField label="Short biography">
            <textarea
              rows={4}
              className="art-field !rounded-xl"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
          </DashboardField>
          <div className="grid gap-3 sm:grid-cols-2">
            <DashboardField label="Main categories">
              <input className="art-field" defaultValue={store.categories.join(", ")} />
            </DashboardField>
            <DashboardField label="Mediums">
              <input className="art-field" defaultValue={store.mediums.join(", ")} />
            </DashboardField>
          </div>
          <button
            onClick={() => toast.success("Store changes saved")}
            className="btn-primary justify-self-start"
          >
            Save changes
          </button>
        </div>
      </Panel>
      <aside className="h-fit overflow-hidden rounded-2xl bg-[var(--ink)] text-[var(--ivory)] xl:sticky xl:top-28">
        <img
          src={store.coverImage}
          alt="Store cover"
          className="h-40 w-full object-cover opacity-65"
        />
        <div className="p-5">
          <img
            src={store.profileImage}
            alt=""
            className="-mt-14 h-20 w-20 rounded-full border-4 border-[var(--ink)] object-cover"
          />
          <h3 className="mt-4 font-display text-3xl">{store.name}</h3>
          <p className="mt-2 text-xs leading-relaxed text-white/60">{tagline}</p>
          <a
            href={`/store/${storeSlug}`}
            className="btn-ghost mt-5 w-full !border-white/20 !text-white"
          >
            <Eye className="h-4 w-4" /> Open public preview
          </a>
        </div>
      </aside>
    </div>
  );
}

function OrdersManager() {
  const [statuses, setStatuses] = useState<Record<string, OrderStatus>>(
    Object.fromEntries(ORDERS.map((order) => [order.id, order.status])),
  );
  const [active, setActive] = useState(ORDERS[0]);
  const nextStatus = (current: OrderStatus): OrderStatus =>
    current === "Seller Confirmed"
      ? "Preparing"
      : current === "Preparing"
        ? "Ready for Pickup"
        : current === "Ready for Pickup"
          ? "Shipped"
          : current;
  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow">Orders</div>
            <h2 className="mt-2 font-display text-3xl">{ORDERS.length} recent orders</h2>
          </div>
          <select className="art-field !w-auto">
            <option>All statuses</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="mt-5 space-y-3">
          {ORDERS.map((order) => (
            <button
              key={order.id}
              onClick={() => setActive(order)}
              className={`w-full rounded-xl border p-4 text-left ${active.id === order.id ? "border-[var(--oxblood)] bg-[var(--ivory)]" : "border-[var(--color-border)]"}`}
            >
              <div className="flex gap-3">
                <img src={order.items[0].image} alt="" className="h-16 w-14 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="truncate text-sm">{order.orderNumber}</strong>
                    <StatusBadge status={statuses[order.id]} />
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {order.items[0].title} · {order.deliveryCity}
                  </div>
                  <div className="mt-2 text-sm font-semibold">{formatPKR(order.total)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Panel>
      <Panel>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="eyebrow">{active.orderNumber}</div>
            <h2 className="mt-2 font-display text-3xl">{active.items[0].title}</h2>
            <div className="mt-2 text-xs text-muted-foreground">
              Placed {active.createdAt} · Buyer: Hamza A.
            </div>
          </div>
          <StatusBadge status={statuses[active.id]} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Order amount", active.subtotal],
            ["Commission", -active.commission],
            ["Shipping", active.shipping],
            ["Estimated payout", active.subtotal - active.commission],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl bg-[var(--ivory)] p-4">
              <div className="text-[11px] text-muted-foreground">{label}</div>
              <div className="mt-2 font-semibold">{formatPKR(Number(value))}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4 text-[var(--oxblood)]" /> Delivery address
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            House 18, Street 7, F-7/2, Islamabad, Pakistan
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Visible because this mock order is confirmed. Contact details remain protected before
            confirmation.
          </p>
        </div>
        <div className="mt-6">
          <div className="eyebrow">Timeline</div>
          <ol className="mt-4 grid gap-3">
            {[
              "Paid",
              "Seller Confirmed",
              "Preparing",
              "Ready for Pickup",
              "Shipped",
              "Delivered",
            ].map((value, index) => (
              <li key={value} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${index < 3 ? "bg-[var(--success)] text-white" : "bg-[var(--ivory)] text-muted-foreground"}`}
                >
                  {index < 3 ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                {value}
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-7 flex flex-wrap gap-2">
          <button
            onClick={() => {
              const next = nextStatus(statuses[active.id]);
              setStatuses((current) => ({ ...current, [active.id]: next }));
              toast.success(`Order marked ${next}`);
            }}
            className="btn-primary"
          >
            <PackageCheck className="h-4 w-4" /> Mark as {nextStatus(statuses[active.id])}
          </button>
          <button
            onClick={() => toast.success("Mock courier pickup requested")}
            className="btn-ghost"
          >
            <Truck className="h-4 w-4" /> Request pickup
          </button>
          <button onClick={() => window.print()} className="btn-ghost">
            <ReceiptText className="h-4 w-4" /> Print invoice
          </button>
          <button onClick={() => toast.success("Demo packing slip prepared")} className="btn-ghost">
            <FileText className="h-4 w-4" /> Packing slip
          </button>
        </div>
      </Panel>
    </div>
  );
}

function MessageCenter() {
  const [active, setActive] = useState("conversation-1");
  const [text, setText] = useState("");
  const [offer, setOffer] = useState<"Pending" | "Accepted" | "Rejected" | "Countered">("Pending");
  const messages = MESSAGES.filter((message) => message.conversationId === active);
  const warning = containsProtectedContact(text);
  function send() {
    if (!text.trim()) return;
    if (warning)
      return toast.error(
        "Keep contact and payment details inside ArtDera until an order is confirmed.",
      );
    toast.success("Demo message sent");
    setText("");
  }
  return (
    <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] lg:grid-cols-[320px_1fr]">
      <aside className="border-b border-[var(--color-border)] lg:border-b-0 lg:border-r">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input className="art-field pl-10" placeholder="Search conversations" />
          </div>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {[
            ["conversation-1", "Hamza Ahmed", ARTWORKS[0], 2],
            ["conversation-2", "Ayesha Khan", ARTWORKS[1], 0],
          ].map(([id, name, artwork, unread]) => (
            <button
              key={id as string}
              onClick={() => setActive(id as string)}
              className={`flex w-full gap-3 p-4 text-left ${active === id ? "bg-[var(--ivory)]" : ""}`}
            >
              <img
                src={(artwork as Artwork).images[0].url}
                alt=""
                className="h-14 w-12 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-semibold">{name as string}</span>
                  {Number(unread) > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--oxblood)] text-[10px] text-white">
                      {unread as number}
                    </span>
                  )}
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  {(artwork as Artwork).title}
                </div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground">
                  Could you confirm the framing?
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>
      <main className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <div className="flex items-center gap-3">
            <img
              src={ARTWORKS[0].images[0].url}
              alt=""
              className="h-11 w-11 rounded-lg object-cover"
            />
            <div>
              <div className="text-sm font-semibold">Hamza Ahmed</div>
              <div className="text-xs text-muted-foreground">About {ARTWORKS[0].title}</div>
            </div>
          </div>
          <div className="flex gap-1">
            <VideoRequest />
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--ivory)]"
              aria-label="Conversation options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto bg-white/30 p-4 md:p-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[82%] rounded-2xl p-4 text-sm leading-relaxed ${message.senderId === "user-artist" ? "ml-auto bg-[var(--ink)] text-[var(--ivory)]" : "bg-[var(--ivory)]"}`}
            >
              {message.body}
              <div
                className={`mt-2 text-[10px] ${message.senderId === "user-artist" ? "text-white/45" : "text-muted-foreground"}`}
              >
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
          <div className="max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-4">
            <div className="eyebrow">Offer</div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="font-display text-2xl">Rs. 72,000</div>
                <div className="text-xs text-muted-foreground">for {ARTWORKS[0].title}</div>
              </div>
              <StatusBadge status={offer} />
            </div>
            {offer === "Pending" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setOffer("Accepted");
                    toast.success("Offer accepted");
                  }}
                  className="btn-primary px-3"
                >
                  Accept
                </button>
                <button onClick={() => setOffer("Countered")} className="btn-ghost px-3">
                  Counter
                </button>
                <button onClick={() => setOffer("Rejected")} className="btn-ghost px-3">
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-[var(--color-border)] p-4">
          {warning && (
            <div className="mb-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Please do not share phone numbers, email, WhatsApp or external payment links before a
              confirmed order.
            </div>
          )}
          <div className="flex gap-2">
            <button
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
              aria-label="Attach a file"
            >
              <Plus className="h-4 w-4" />
            </button>
            <label className="sr-only" htmlFor="seller-message">
              Write a message
            </label>
            <textarea
              id="seller-message"
              rows={2}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Write a message…"
              className="art-field !rounded-xl"
            />
            <button onClick={send} className="btn-primary self-end">
              Send
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <button>Report conversation</button>
            <button>Block buyer</button>
            <button>Mark as spam</button>
            <button>Archive</button>
          </div>
        </div>
      </main>
    </div>
  );
}

function VideoRequest() {
  const [date, setDate] = useState("2026-07-24");
  const [time, setTime] = useState("16:00");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--ivory)]"
          aria-label="Video consultation"
        >
          <Video className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[var(--porcelain)]">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">Video consultation request</DialogTitle>
          <DialogDescription>
            Accept, suggest another time or decline. No live video provider is connected.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <DashboardField label="Preferred date">
            <input
              type="date"
              className="art-field"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </DashboardField>
          <DashboardField label="Time">
            <input
              type="time"
              className="art-field"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </DashboardField>
          <DashboardField label="Mock meeting link" wide>
            <input className="art-field" placeholder="Added after acceptance" />
          </DashboardField>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => toast.success("Consultation accepted")} className="btn-primary">
            Accept
          </button>
          <button onClick={() => toast.info("New time suggested")} className="btn-ghost">
            Suggest another time
          </button>
          <button onClick={() => toast.info("Consultation declined")} className="btn-ghost">
            Decline
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Customers({ planId }: { planId: PlanId }) {
  if (planId !== "gallery" && planId !== "pro-plus")
    return (
      <UpgradePanel
        title="Customer management is included with Pro Plus."
        body="Organise collectors, private notes, tags and consent-aware follow-ups. Contact details remain protected until an order is completed."
      />
    );
  return (
    <Panel>
      <PrivacyNotice />
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs text-muted-foreground">
              {[
                "Customer",
                "Orders",
                "Spending",
                "Last purchase",
                "Favourite",
                "Location",
                "Consent",
                "Action",
              ].map((value) => (
                <th key={value} className="p-3">
                  {value}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CUSTOMERS.map((customer) => (
              <tr key={customer.id} className="border-b border-[var(--color-border)]">
                <td className="p-3">
                  <strong>{customer.buyerName}</strong>
                  <div className="mt-1 flex gap-1">
                    {customer.tags.map((tag) => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3">{customer.completedOrders}</td>
                <td className="p-3">{formatPKR(customer.totalSpending)}</td>
                <td className="p-3">{customer.lastPurchase}</td>
                <td className="p-3">{customer.favouriteCategory}</td>
                <td className="p-3">{customer.city}</td>
                <td className="p-3">
                  <StatusBadge status={customer.marketingConsent ? "Consented" : "No consent"} />
                </td>
                <td className="p-3">
                  <button onClick={() => toast.info(customer.notes)} className="btn-ghost px-3">
                    Notes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Analytics({ planId }: { planId: PlanId }) {
  const total = (key: keyof (typeof ANALYTICS)[number]) =>
    ANALYTICS.reduce((sum, item) => sum + Number(item[key]), 0);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Store views", total("storeViews"), "+18.4%"],
          ["Artwork views", total("artworkViews"), "+12.1%"],
          ["Unique visitors", total("uniqueVisitors"), "+9.8%"],
          ["Conversion rate", "1.6%", "+0.3%"],
        ].map(([label, value, change]) => (
          <Metric
            key={label as string}
            label={label as string}
            value={String(value)}
            change={change as string}
          />
        ))}
      </div>
      <Panel>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="eyebrow">Last 7 days</div>
            <h2 className="mt-2 font-display text-3xl">Store and artwork attention</h2>
          </div>
          <span className="chip">{PLANS[planId].analytics} analytics</span>
        </div>
        <div className="mt-6 h-[330px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ANALYTICS}>
              <defs>
                <linearGradient id="storeAnalytics" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#263454" stopOpacity={0.35} />
                  <stop offset="1" stopColor="#263454" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#ddd4c7" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => value.slice(5)}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="artworkViews"
                stroke="#263454"
                strokeWidth={2}
                fill="url(#storeAnalytics)"
              />
              <Area
                type="monotone"
                dataKey="storeViews"
                stroke="#b65f42"
                strokeWidth={2}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      {planId !== "free" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel>
            <div className="eyebrow">Top artworks</div>
            <div className="mt-5 space-y-3">
              {ARTWORKS.slice(0, 4).map((artwork, index) => (
                <div
                  key={artwork.id}
                  className="grid grid-cols-[30px_52px_1fr_auto] items-center gap-3"
                >
                  <span className="font-display text-xl text-muted-foreground">{index + 1}</span>
                  <img
                    src={artwork.images[0].url}
                    alt=""
                    className="h-14 w-12 rounded object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold">{artwork.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {artwork.saves} saves · {artwork.messages} messages
                    </div>
                  </div>
                  <strong className="text-sm">{artwork.views}</strong>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <div className="eyebrow">Traffic and visitors</div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <AnalyticsList
                title="Sources"
                items={[
                  ["ArtDera search", "38%"],
                  ["Direct", "24%"],
                  ["Instagram", "18%"],
                  ["Collections", "12%"],
                  ["Google", "8%"],
                ]}
              />
              <AnalyticsList
                title="Cities"
                items={[
                  ["Lahore", "32%"],
                  ["Karachi", "26%"],
                  ["Islamabad", "18%"],
                  ["Rawalpindi", "9%"],
                  ["Other", "15%"],
                ]}
              />
            </div>
          </Panel>
        </div>
      )}
      {planId === "free" && (
        <UpgradePanel
          compact
          title="Detailed analytics start with Professional."
          body="Your Free plan keeps essential store and artwork views visible. Upgrade for visitor, source and conversion detail."
        />
      )}
      {planId === "professional" && (
        <UpgradePanel
          compact
          title="Advanced audience and revenue reports"
          body="Pro Plus adds deeper visitor geography, customer segments and promotion conversion detail."
        />
      )}
    </div>
  );
}

function Promotions() {
  const [artwork, setArtwork] = useState(ARTWORKS[0].id);
  const [placement, setPlacement] = useState(PROMOTION_PLACEMENTS[0].id);
  const [paymentMethod, setPaymentMethod] = useState("Demo card");
  const [campaigns, setCampaigns] = useState(() => PromotionService.list());
  const selected = PROMOTION_PLACEMENTS.find((item) => item.id === placement)!;
  return (
    <div className="space-y-6">
      <Panel>
        <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="eyebrow">Create promotion</div>
            <h2 className="mt-2 font-display text-3xl">Choose measured visibility.</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Sponsored placements are labelled and never exceed one in every five marketplace
              cards.
            </p>
            <div className="mt-6 grid gap-4">
              <DashboardField label="Artwork">
                <select
                  className="art-field"
                  value={artwork}
                  onChange={(event) => setArtwork(event.target.value)}
                >
                  {ARTWORKS.slice(0, 4).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </DashboardField>
              <DashboardField label="Promotion">
                <select
                  className="art-field"
                  value={placement}
                  onChange={(event) => setPlacement(event.target.value)}
                >
                  {PROMOTION_PLACEMENTS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ·{" "}
                      {item.priceMin === item.priceMax
                        ? formatPKR(item.priceMin)
                        : `${formatPKR(item.priceMin)}–${formatPKR(item.priceMax)}`}
                    </option>
                  ))}
                </select>
              </DashboardField>
              <div className="grid gap-4 sm:grid-cols-2">
                <DashboardField label="Start date">
                  <input type="date" defaultValue="2026-07-24" className="art-field" />
                </DashboardField>
                <DashboardField label="End date">
                  <input type="date" defaultValue="2026-07-31" className="art-field" />
                </DashboardField>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-[var(--ivory)] p-5">
            <div className="eyebrow">Placement preview</div>
            <div className="relative mt-4 overflow-hidden rounded-xl">
              <img
                src={ARTWORKS.find((item) => item.id === artwork)?.images[0].url}
                alt="Promotion preview"
                className="aspect-[4/3] w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded-full bg-[var(--porcelain)] px-2 py-1 text-[10px] font-bold">
                Sponsored
              </span>
            </div>
            <div className="mt-4 font-display text-2xl">{selected.name}</div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {selected.description}
            </p>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="text-[11px] text-muted-foreground">Mock total</div>
                <div className="font-display text-3xl">
                  {selected.priceMin === selected.priceMax
                    ? formatPKR(selected.priceMin)
                    : `From ${formatPKR(selected.priceMin)}`}
                </div>
              </div>
              {selected.requiresApproval && <span className="chip">Admin approval</span>}
            </div>
            <label className="mt-5 block">
              <span className="eyebrow mb-2 block">Mock payment method</span>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="art-field"
              >
                <option>Demo card</option>
                <option>Easypaisa simulation</option>
                <option>JazzCash simulation</option>
                <option>Raast simulation</option>
              </select>
            </label>
            <button
              onClick={() => {
                const next = PromotionService.create({
                  artworkId: artwork,
                  placementId: selected.id,
                  status: selected.requiresApproval ? "Pending" : "Scheduled",
                  startDate: "2026-07-24",
                  endDate: new Date(
                    new Date("2026-07-24").getTime() + selected.durationDays * 86400000,
                  )
                    .toISOString()
                    .slice(0, 10),
                  price: selected.priceMin,
                  impressions: 0,
                  clicks: 0,
                  saves: 0,
                  messages: 0,
                  conversions: 0,
                });
                setCampaigns(PromotionService.list());
                toast.success(`Promotion paid with ${paymentMethod}`, {
                  description: selected.requiresApproval
                    ? "Status: Pending admin review"
                    : "Status: Scheduled",
                });
                return next;
              }}
              className="btn-primary mt-5 w-full"
            >
              Complete Mock Payment
            </button>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="eyebrow">Campaigns</div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {campaigns.map((promotion) => {
            const place = PROMOTION_PLACEMENTS.find((item) => item.id === promotion.placementId);
            const art = ARTWORKS.find((item) => item.id === promotion.artworkId);
            return (
              <article
                key={promotion.id}
                className="rounded-xl border border-[var(--color-border)] p-4"
              >
                <div className="flex items-start gap-3">
                  <img src={art?.images[0].url} alt="" className="h-16 w-14 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{place?.name}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{art?.title}</div>
                    <div className="mt-2">
                      <StatusBadge status={promotion.status} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2 text-center">
                  {[
                    ["Views", promotion.impressions],
                    ["Clicks", promotion.clicks],
                    ["Saves", promotion.saves],
                    ["Messages", promotion.messages],
                    ["Sales", promotion.conversions],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <div className="text-sm font-semibold">{value}</div>
                      <div className="text-[9px] text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function Shipping() {
  const [weight, setWeight] = useState(3);
  const [distance, setDistance] = useState("Lahore to Islamabad");
  const [fragile, setFragile] = useState(false);
  const [framed, setFramed] = useState(true);
  const courier = Math.round(
    900 +
      weight * 420 +
      (distance.includes("Karachi") ? 900 : 350) +
      (fragile ? 850 : 0) +
      (framed ? 480 : 0),
  );
  const packaging = Math.round(700 + weight * 180 + (fragile ? 1100 : 0));
  const handling = 450;
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <Panel>
        <div className="eyebrow">Shipping preferences</div>
        <h2 className="mt-2 font-display text-3xl">Estimate before you promise.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          All values are frontend estimates. No courier service is connected.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <DashboardField label="Pickup and delivery">
            <select
              value={distance}
              onChange={(event) => setDistance(event.target.value)}
              className="art-field"
            >
              <option>Lahore to Islamabad</option>
              <option>Karachi to Lahore</option>
              <option>Islamabad to Peshawar</option>
              <option>Multan to Quetta</option>
            </select>
          </DashboardField>
          <DashboardField label="Weight (kg)">
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={weight}
              onChange={(event) => setWeight(Number(event.target.value))}
              className="art-field"
            />
          </DashboardField>
          <DashboardField label="Width × height × depth">
            <input className="art-field" defaultValue="60 × 76 × 5 cm" />
          </DashboardField>
          <DashboardField label="Packaging type">
            <select className="art-field">
              <option>Corner protection + art box</option>
              <option>Wooden crate</option>
              <option>Protective tube</option>
            </select>
          </DashboardField>
          <DashboardToggle label="Framed" checked={framed} onChange={setFramed} />
          <DashboardToggle label="Glass or fragile" checked={fragile} onChange={setFragile} />
          <DashboardToggle label="Domestic shipping" checked onChange={() => {}} />
          <DashboardToggle label="International interest" checked={false} onChange={() => {}} />
        </div>
      </Panel>
      <Panel>
        <div className="eyebrow">Buyer estimate</div>
        <h2 className="mt-2 font-display text-3xl">Estimated delivery total</h2>
        <dl className="mt-6 divide-y divide-[var(--color-border)]">
          {[
            ["Artwork price", 84000],
            ["Estimated courier cost", courier],
            ["Packaging cost", packaging],
            ["Handling cost", handling],
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between py-4 text-sm">
              <dt>{label}</dt>
              <dd className="font-semibold">{formatPKR(Number(value))}</dd>
            </div>
          ))}
        </dl>
        <div className="flex justify-between border-t-2 border-[var(--ink)] pt-5 font-display text-2xl">
          <span>Estimated total</span>
          <span>{formatPKR(84000 + courier + packaging + handling)}</span>
        </div>
        <div className="mt-5 flex gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          <Truck className="h-4 w-4 shrink-0" />
          This estimate can change after courier, packaging and insurance services are connected.
        </div>
        <div className="mt-5">
          <div className="eyebrow">Current shipment</div>
          {SHIPMENTS.map((shipment) => (
            <div
              key={shipment.id}
              className="mt-3 rounded-xl border border-[var(--color-border)] p-4"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">
                    {shipment.pickupCity} → {shipment.deliveryCity}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {shipment.trackingNumber}
                  </div>
                </div>
                <StatusBadge status={shipment.status} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Payouts({ planId }: { planId: PlanId }) {
  const payout = PAYOUTS[0];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Available balance", "Rs. 128,400", WalletCards],
          ["Pending balance", "Rs. 82,110", CircleDollarSign],
          ["On hold", "Rs. 0", LockKeyhole],
          ["Completed payouts", "Rs. 1.24m", CheckCircle2],
        ].map(([label, value, Icon]) => {
          const ItemIcon = Icon as LucideIcon;
          return (
            <Panel key={label as string} compact>
              <ItemIcon className="h-5 w-5 text-[var(--oxblood)]" />
              <div className="mt-4 text-xs text-muted-foreground">{label as string}</div>
              <div className="mt-1 font-display text-3xl">{value as string}</div>
            </Panel>
          );
        })}
      </div>
      <Panel>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="eyebrow">Estimated payout</div>
            <h2 className="mt-2 font-display text-3xl">Order {ORDERS[0].orderNumber}</h2>
          </div>
          <StatusBadge status={payout.status} />
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <tbody>
              {[
                ["Gross artwork amount", payout.gross],
                ["Commission", -payout.commission],
                ["Shipping deduction", -payout.shippingDeduction],
                ["Estimated tax deduction", -payout.taxEstimate],
                ["Payment-processing deduction", -payout.processingDeduction],
                ["Refund adjustment", payout.refundAdjustment],
                ["Net payout", payout.net],
              ].map(([label, value], index) => (
                <tr
                  key={label as string}
                  className={`border-b border-[var(--color-border)] ${index === 6 ? "text-base font-bold" : ""}`}
                >
                  <td className="p-4">{label}</td>
                  <td className="p-4 text-right">{formatPKR(Number(value))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 rounded-xl bg-[var(--ivory)] p-4 text-sm">
          <strong>{PLANS[planId].payoutTime}</strong>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Timing begins after successful delivery and order completion when backend payouts are
            connected.
          </p>
        </div>
      </Panel>
      <Panel>
        <div className="eyebrow">Payout setup · Demo values only</div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            ["Account holder", "Areeba Hasan"],
            ["Bank", "Demo Bank Pakistan"],
            ["Account number", "•••• •••• 4821"],
            ["IBAN", "PK00 DEMO 0000 0000 4821"],
            ["Verification", "Pending backend connection"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[var(--ivory)] p-4">
              <div className="text-[11px] text-muted-foreground">{label}</div>
              <div className="mt-2 text-sm font-semibold">{value}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Do not enter real bank details in this frontend demo.
        </p>
      </Panel>
    </div>
  );
}

function Reviews() {
  return (
    <Panel>
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">Store rating</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-display text-5xl">4.9</span>
            <div>
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} className="h-4 w-4" fill="currentColor" />
                ))}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">38 verified-order reviews</div>
            </div>
          </div>
        </div>
        <button className="btn-ghost">Review settings</button>
      </div>
      <div className="mt-7 space-y-4">
        {REVIEWS.map((review) => (
          <article key={review.id} className="rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex justify-between">
              <div className="flex text-amber-500">
                {Array.from({ length: review.rating }, (_, index) => (
                  <Star key={index} className="h-3.5 w-3.5" fill="currentColor" />
                ))}
              </div>
              <StatusBadge status={review.status} />
            </div>
            <h3 className="mt-3 font-semibold">{review.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
            <div className="mt-4 flex gap-3 text-xs">
              <button className="font-semibold underline">Reply</button>
              <button className="text-muted-foreground">Report</button>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function Verification() {
  const [submitted, setSubmitted] = useState(true);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow">Verification request</div>
            <h2 className="mt-2 font-display text-3xl">Identity and portfolio review</h2>
          </div>
          <StatusBadge status={submitted ? "Approved" : "Not submitted"} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Verification is granted only after review. A subscription payment never guarantees
          approval.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["Email", "Verified"],
            ["Phone", "Verified"],
            ["Identity", "Approved"],
            ["Portfolio", "Approved"],
            ["Ownership declaration", "Confirmed"],
            ["Public badge", "Visible"],
          ].map(([label, status]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl bg-[var(--ivory)] p-4 text-sm"
            >
              <span>{label}</span>
              <span className="font-semibold text-[var(--success)]">{status}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            setSubmitted(true);
            toast.success("Mock request submitted");
          }}
          className="btn-ghost mt-6"
        >
          Submit updated information
        </button>
      </Panel>
      <Panel>
        <ShieldCheck className="h-8 w-8 text-[var(--indigo)]" />
        <h2 className="mt-5 font-display text-3xl">What the badge means</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <li>Identity or business information passed ArtDera's review.</li>
          <li>Portfolio information was reviewed for consistency.</li>
          <li>It does not guarantee artwork quality, investment value or delivery outcome.</li>
          <li>Sponsored status never affects verification.</li>
        </ul>
      </Panel>
    </div>
  );
}

function Billing({
  planId,
  userId,
  role,
}: {
  planId: PlanId;
  userId: string;
  role: "artist" | "gallery";
}) {
  const initialSubscription = SubscriptionService.getForUser(userId);
  const [cycle, setCycle] = useState<"monthly" | "annual">(
    initialSubscription?.billingCycle === "annual" ? "annual" : "monthly",
  );
  const [activePlanId, setActivePlanId] = useState(planId);
  const [active, setActive] = useState(initialSubscription?.status !== "Cancelled");
  const [changeOpen, setChangeOpen] = useState(false);
  const [requestedPlan, setRequestedPlan] = useState<PlanId | null>(null);
  const [downgradeEffective, setDowngradeEffective] = useState<"immediately" | "end-of-cycle">(
    "end-of-cycle",
  );
  const plan = PLANS[activePlanId];
  const subscription = SubscriptionService.getForUser(userId);
  const invoices = InvoiceService.listFor(userId);
  const activeStore = ArtistService.getStoreForUser(userId);
  const usage = FeatureAccessService.usage(userId, activeStore?.id);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("upgrade");
    if (requested && PLAN_ORDER.includes(requested as PlanId) && requested !== activePlanId) {
      setRequestedPlan(requested as PlanId);
      setChangeOpen(true);
    }
  }, [activePlanId]);

  return (
    <div className="space-y-6">
      <Panel>
        <div className="grid gap-7 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="eyebrow">Current plan</div>
            <h2 className="mt-2 font-display text-4xl">{plan.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={active ? "Active" : "Cancelled"} />
              <span className="chip">{subscription?.billingCycle ?? cycle} billing</span>
              <span className="chip">{plan.commission}% commission</span>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              {usage.activeListings} of {plan.listingLimit ?? "fair-use unlimited"} active listings
              · Payout: {plan.payoutTime}
            </p>
            <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Start date</dt>
                <dd className="mt-1 font-semibold">
                  {subscription?.startedAt
                    ? new Date(subscription.startedAt).toLocaleDateString("en-PK")
                    : "Not available"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Next billing date</dt>
                <dd className="mt-1 font-semibold">
                  {subscription?.renewsAt
                    ? new Date(subscription.renewsAt).toLocaleDateString("en-PK")
                    : "Not applicable"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Listing usage</dt>
                <dd className="mt-1 font-semibold">
                  {usage.activeListings} / {plan.listingLimit ?? "Fair-use"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Subscription status</dt>
                <dd className="mt-1 font-semibold">{subscription?.status ?? "Active"}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl bg-[var(--ivory)] p-5 text-right">
            <div className="text-xs text-muted-foreground">Mock subscription</div>
            <div className="mt-2 font-display text-4xl">
              {formatPKR(
                subscription?.price ??
                  (cycle === "annual" && plan.annualPrice ? plan.annualPrice : plan.monthlyPrice),
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">No payment processed</div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-2">
          <Dialog open={changeOpen} onOpenChange={setChangeOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary">Compare and change plan</button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto bg-[var(--porcelain)]">
              <DialogHeader>
                <DialogTitle className="font-display text-3xl">Compare seller plans</DialogTitle>
                <DialogDescription>
                  All changes are simulations. Downgrading archives listings above the new limit; it
                  never deletes artwork.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {Object.values(PLANS).map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 ${item.id === activePlanId || item.id === requestedPlan ? "border-[var(--oxblood)]" : "border-[var(--color-border)]"}`}
                  >
                    <div className="flex justify-between">
                      <strong>{item.name}</strong>
                      {item.id === activePlanId && <span className="chip">Current</span>}
                    </div>
                    <div className="mt-2 font-display text-2xl">
                      {formatPKR(item.monthlyPrice)}/mo
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {item.listingLimit ?? "Fair-use unlimited"} listings · {item.commission}%
                      commission
                    </div>
                    <button
                      disabled={item.id === activePlanId}
                      onClick={() => {
                        const movingUp =
                          PLAN_ORDER.indexOf(item.id) > PLAN_ORDER.indexOf(activePlanId);
                        if (movingUp) {
                          if (
                            item.id === "gallery" &&
                            role !== "gallery" &&
                            !window.confirm(
                              "The Gallery Plan is for a gallery or art business managing multiple artists. Confirm that this account should register as a gallery or art business.",
                            )
                          )
                            return;
                          if (item.id === "gallery")
                            SubscriptionService.confirmGalleryRegistration(userId);
                          SubscriptionService.selectPlan(item.id, "monthly");
                          window.location.assign("/artist/checkout?change=upgrade");
                          return;
                        }
                        const lost = plan.allowedModules.filter(
                          (module) => !item.allowedModules.includes(module),
                        );
                        if (
                          !window.confirm(
                            `Downgrade to ${item.name}? The new listing limit is ${item.listingLimit ?? "fair-use unlimited"}, commission is ${item.commission}%, and these tools will be locked: ${lost.join(", ") || "none"}. Artwork and order history will not be deleted.`,
                          )
                        )
                          return;
                        SubscriptionService.scheduleDowngrade(userId, item.id, downgradeEffective);
                        if (downgradeEffective === "immediately") setActivePlanId(item.id);
                        toast.success(
                          downgradeEffective === "immediately"
                            ? `Downgraded to ${item.name}`
                            : `Downgrade to ${item.name} scheduled`,
                          {
                            description:
                              downgradeEffective === "immediately"
                                ? "Artwork over the new limit was archived, never deleted."
                                : "The change will apply at the end of the current billing cycle.",
                          },
                        );
                      }}
                      className="btn-ghost mt-4 w-full disabled:cursor-default disabled:opacity-55"
                    >
                      {item.id === activePlanId
                        ? "Current plan"
                        : PLAN_ORDER.indexOf(item.id) > PLAN_ORDER.indexOf(activePlanId)
                          ? `Upgrade to ${item.name}`
                          : `Downgrade to ${item.name}`}
                    </button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <label className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-border)] px-4 text-xs font-semibold">
            Downgrades
            <select
              value={downgradeEffective}
              onChange={(event) =>
                setDowngradeEffective(event.target.value as typeof downgradeEffective)
              }
              className="bg-transparent"
            >
              <option value="end-of-cycle">At end of billing cycle</option>
              <option value="immediately">Apply immediately</option>
            </select>
          </label>
          {plan.annualPrice && (
            <button
              onClick={() => {
                const next = cycle === "monthly" ? "annual" : "monthly";
                setCycle(next);
                SubscriptionService.activate(userId, activePlanId, next);
                toast.success("Billing cycle updated in demo");
              }}
              className="btn-ghost"
            >
              Switch to {cycle === "monthly" ? "annual" : "monthly"}
            </button>
          )}
          <button
            onClick={() => {
              setActive((value) => !value);
              SubscriptionService.updateStatus(userId, active ? "Cancelled" : "Active");
              toast.success(active ? "Subscription cancelled in demo" : "Subscription reactivated");
            }}
            className="btn-ghost"
          >
            {active ? "Cancel subscription" : "Reactivate"}
          </button>
        </div>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="eyebrow">Included features</div>
          <ul className="mt-4 space-y-2 text-sm">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[var(--success)]" /> {feature}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <div className="eyebrow">Locked features</div>
          {plan.lockedModules.length ? (
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {plan.lockedModules.map((feature) => (
                <li key={feature} className="flex gap-2 capitalize">
                  <LockKeyhole className="mt-0.5 h-4 w-4" /> {feature.replaceAll("-", " ")}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              All modules available for this seller type are unlocked.
            </p>
          )}
        </Panel>
      </div>
      <Panel>
        <div className="eyebrow">Mock invoices</div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3">Invoice</th>
                <th className="p-3">Date</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(invoices.length
                ? invoices
                : [
                    {
                      id: "INV-DEMO-SEED",
                      issuedAt: subscription?.startedAt ?? "2026-07-01",
                      planId: activePlanId,
                      total: subscription?.price ?? plan.monthlyPrice,
                      status: "Paid" as const,
                    },
                  ]
              ).map((invoice) => (
                <tr key={invoice.id} className="border-b">
                  <td className="p-3 font-semibold">{invoice.id}</td>
                  <td className="p-3">{new Date(invoice.issuedAt).toLocaleDateString("en-PK")}</td>
                  <td className="p-3">{PLANS[invoice.planId].name}</td>
                  <td className="p-3">{formatPKR(invoice.total)}</td>
                  <td className="p-3">
                    <StatusBadge status={invoice.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ManagedArtists() {
  const [artists, setArtists] = useState([
    { name: "Hira Qureshi", city: "Karachi", works: 18, sales: 12, status: "Active" },
    { name: "Usman Ali", city: "Lahore", works: 24, sales: 8, status: "Active" },
    { name: "Zoya Kamal", city: "Islamabad", works: 11, sales: 5, status: "Review" },
  ]);
  return (
    <Panel>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="eyebrow">Artist roster</div>
          <h2 className="mt-2 font-display text-3xl">{artists.length} managed artists</h2>
        </div>
        <button
          onClick={() => {
            setArtists((values) => [
              ...values,
              { name: "New Artist", city: "Multan", works: 0, sales: 0, status: "Invited" },
            ]);
            toast.success("Artist invitation created");
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Add artist
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {artists.map((artist, index) => (
          <article
            key={`${artist.name}-${index}`}
            className="rounded-xl border border-[var(--color-border)] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ivory)] font-display text-xl">
                {artist.name
                  .split(" ")
                  .map((value) => value[0])
                  .join("")}
              </div>
              <div>
                <div className="font-semibold">{artist.name}</div>
                <div className="text-xs text-muted-foreground">{artist.city}</div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <div className="font-display text-2xl">{artist.works}</div>
                <div className="text-[10px] text-muted-foreground">Inventory</div>
              </div>
              <div>
                <div className="font-display text-2xl">{artist.sales}</div>
                <div className="text-[10px] text-muted-foreground">Sales</div>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <StatusBadge status={artist.status} />
              <button className="text-xs font-semibold underline">Edit profile</button>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function StaffAccounts() {
  return (
    <Panel>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="eyebrow">Staff accounts</div>
          <h2 className="mt-2 font-display text-3xl">3 of 10 seats used</h2>
        </div>
        <button
          onClick={() => toast.success("Mock staff invitation prepared")}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Invite staff
        </button>
      </div>
      <div className="mt-5 flex gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Permission choices are a frontend simulation. Real role security must be enforced by the
        backend.
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3">Staff member</th>
              <th className="p-3">Role</th>
              <th className="p-3">Permissions</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {STAFF.map((member) => (
              <tr key={member.id} className="border-b">
                <td className="p-3">
                  <strong>{member.name}</strong>
                  <div className="text-xs text-muted-foreground">{member.email}</div>
                </td>
                <td className="p-3">{member.role}</td>
                <td className="p-3">{member.permissions.join(", ")}</td>
                <td className="p-3">
                  <StatusBadge status={member.status} />
                </td>
                <td className="p-3">
                  <button className="btn-ghost px-3">Permissions</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Exhibitions() {
  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="eyebrow">Exhibitions</div>
            <h2 className="mt-2 font-display text-3xl">Curate public programmes.</h2>
          </div>
          <button
            onClick={() => toast.success("New exhibition draft created")}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> New exhibition
          </button>
        </div>
      </Panel>
      {EXHIBITIONS.map((exhibition) => (
        <article
          key={exhibition.id}
          className="grid overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] md:grid-cols-[280px_1fr]"
        >
          <img
            src={exhibition.coverImage}
            alt={exhibition.name}
            className="h-full min-h-56 w-full object-cover"
          />
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={exhibition.published ? "Published" : "Draft"} />
              <span className="chip">{exhibition.format}</span>
            </div>
            <h2 className="mt-4 font-display text-4xl">{exhibition.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {exhibition.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                {exhibition.venue}
              </span>
              <span>
                <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                {exhibition.startDate} – {exhibition.endDate}
              </span>
              <span>
                {exhibition.artistIds.length} artists · {exhibition.artworkIds.length} artworks
              </span>
            </div>
            <div className="mt-6 flex gap-2">
              <button className="btn-primary">Edit exhibition</button>
              <button className="btn-ghost">View public page</button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function GalleryReports() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Sales by artists", "Rs. 4.8m", "+14%"],
          ["Inventory value", "Rs. 18.2m", "86 works"],
          ["Promotion return", "4.2×", "12 campaigns"],
          ["Pending payout", "Rs. 684k", "6 orders"],
        ].map(([label, value, change]) => (
          <Metric key={label} label={label} value={value} change={change} />
        ))}
      </div>
      <Panel>
        <div className="eyebrow">Report library</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Sales by artist",
            "Sales by artwork",
            "Inventory status",
            "Top categories",
            "Buyer locations",
            "Staff activity",
            "Promotion performance",
            "Payout report",
          ].map((label) => (
            <button
              key={label}
              onClick={() =>
                toast.success(`${label} report prepared`, {
                  description: "Demo report — no sensitive data exported.",
                })
              }
              className="flex min-h-20 items-center justify-between rounded-xl bg-[var(--ivory)] p-4 text-left text-sm font-semibold"
            >
              {label}
              <FileText className="h-5 w-5 text-[var(--oxblood)]" />
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Support({ planId }: { planId: PlanId }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
      <Panel>
        {sent ? (
          <EmptyState
            icon={CheckCircle2}
            title="Support request sent."
            body="A demo ticket AD-SUP-1048 is now Open. No external message was sent."
            action={["Send another", "/artist/dashboard/support"]}
          />
        ) : (
          <>
            <div className="eyebrow">Contact support</div>
            <h2 className="mt-2 font-display text-3xl">How can we help?</h2>
            <div className="mt-6 grid gap-4">
              <DashboardField label="Topic">
                <select className="art-field">
                  <option>Orders and shipping</option>
                  <option>Artwork review</option>
                  <option>Verification</option>
                  <option>Subscription</option>
                  <option>Technical issue</option>
                </select>
              </DashboardField>
              <DashboardField label="Subject">
                <input className="art-field" />
              </DashboardField>
              <DashboardField label="Message">
                <textarea rows={6} className="art-field !rounded-xl" />
              </DashboardField>
              <button onClick={() => setSent(true)} className="btn-primary justify-self-start">
                Send support request
              </button>
            </div>
          </>
        )}
      </Panel>
      <Panel>
        <div className="eyebrow">Help centre</div>
        <div className="mt-4 space-y-2">
          {[
            "Preparing artwork for delivery",
            "Understanding listing reviews",
            "How verification works",
            "Promotion placement rules",
            "Payout timing explained",
          ].map((label) => (
            <a
              key={label}
              href="/help"
              className="flex min-h-12 items-center justify-between rounded-xl bg-[var(--ivory)] px-4 text-sm font-semibold"
            >
              {label}
              <ChevronRight className="h-4 w-4" />
            </a>
          ))}
        </div>
        {planId === "free" && (
          <div className="mt-5 rounded-xl bg-[var(--ivory)] p-4 text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Need priority support?</strong> Professional adds
            priority assistance alongside 50 listings and detailed analytics.
            <a
              href="/artist/dashboard/subscription?upgrade=professional"
              className="mt-3 block font-semibold text-foreground underline"
            >
              Compare Professional
            </a>
          </div>
        )}
      </Panel>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <Panel>
        <div className="eyebrow">Profile settings</div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <DashboardField label="Full name">
            <input className="art-field" defaultValue="Areeba Hasan" />
          </DashboardField>
          <DashboardField label="Email">
            <input type="email" className="art-field" defaultValue="artist@artdera.demo" />
          </DashboardField>
          <DashboardField label="Language">
            <select className="art-field">
              <option>English</option>
              <option>Urdu</option>
            </select>
          </DashboardField>
          <DashboardField label="Timezone">
            <select className="art-field">
              <option>Pakistan Standard Time (UTC+5)</option>
            </select>
          </DashboardField>
        </div>
        <button
          onClick={() => toast.success("Profile settings saved")}
          className="btn-primary mt-6"
        >
          Save profile
        </button>
      </Panel>
      <Panel>
        <div className="eyebrow">Notification preferences</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            "New messages",
            "New offers",
            "Order updates",
            "Artwork review",
            "Promotion status",
            "Payout updates",
            "Support responses",
            "Subscription reminders",
          ].map((label) => (
            <DashboardToggle key={label} label={label} checked onChange={() => {}} />
          ))}
        </div>
      </Panel>
      <Panel>
        <div className="eyebrow">Privacy and security simulation</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => toast.info("Password reset flow opened in demo")}
            className="btn-ghost justify-start"
          >
            <LockKeyhole className="h-4 w-4" /> Change password
          </button>
          <button
            onClick={() => toast.info("All other demo sessions signed out")}
            className="btn-ghost justify-start"
          >
            <ShieldCheck className="h-4 w-4" /> Sign out other sessions
          </button>
        </div>
      </Panel>
    </div>
  );
}

function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(NOTIFICATIONS.filter((item) => item.userId === userId));
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--porcelain)]"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {items.some((item) => !item.read) && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--oxblood)]" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-13 z-30 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-3 shadow-[var(--shadow-lift)]">
          <div className="flex items-center justify-between p-2">
            <strong>Notifications</strong>
            <button
              onClick={() => setItems((values) => values.map((item) => ({ ...item, read: true })))}
              className="text-[11px] font-semibold underline"
            >
              Mark all read
            </button>
          </div>
          <div className="mt-1 space-y-1">
            {items.length ? (
              items.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={`block rounded-xl p-3 ${item.read ? "" : "bg-[var(--ivory)]"}`}
                >
                  <div className="text-xs font-semibold">{item.title}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {item.body}
                  </div>
                </a>
              ))
            ) : (
              <div className="p-5 text-center text-xs text-muted-foreground">No notifications.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="container-editorial py-10">
      <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
        <div className="h-[650px] animate-pulse rounded-2xl bg-[var(--ink)]/80" />
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-[var(--porcelain)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
function DashboardAccess() {
  return (
    <div className="container-editorial flex min-h-[65vh] items-center justify-center py-16">
      <div className="max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-8 text-center">
        <LockKeyhole className="mx-auto h-9 w-9 text-[var(--oxblood)]" />
        <h1 className="mt-5 font-display text-4xl">Seller sign-in required.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This frontend route is role-aware, but real authorization must be enforced by the future
          backend.
        </p>
        <Link to="/auth/login" className="btn-primary mt-6">
          Sign in to seller demo
        </Link>
      </div>
    </div>
  );
}
function Panel({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <section
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] ${compact ? "p-5" : "p-5 md:p-6"}`}
    >
      {children}
    </section>
  );
}
function Metric({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <Panel compact>
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="mt-3 font-display text-3xl">{value}</div>
      <div className="mt-1 flex items-center gap-1 text-xs text-[var(--success)]">
        <ArrowUpRight className="h-3 w-3" />
        {change}
      </div>
    </Panel>
  );
}
function StatusBadge({ status }: { status: string }) {
  const positive =
    /Published|Approved|Active|Completed|Paid|Delivered|Verified|Consented|Accepted/i.test(status);
  const warning = /Pending|Preparing|Review|Required|Awaiting|Invited|Scheduled|Packaging/i.test(
    status,
  );
  const negative = /Rejected|Cancelled|Disputed|Damaged|No consent|Suspended/i.test(status);
  return (
    <span
      className={`inline-flex max-w-max rounded-full px-2.5 py-1 text-[10px] font-bold ${positive ? "bg-emerald-50 text-emerald-800" : warning ? "bg-amber-50 text-amber-900" : negative ? "bg-red-50 text-red-800" : "bg-[var(--ivory)] text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}
function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action: [string, string];
}) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ivory)]">
        <Icon className="h-6 w-6 text-[var(--oxblood)]" />
      </div>
      <h2 className="mt-5 font-display text-3xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      <a href={action[1]} className="btn-primary mt-5">
        {action[0]}
      </a>
    </div>
  );
}
function PrivacyNotice() {
  return (
    <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
      <ShieldCheck className="h-4 w-4 shrink-0" />
      Customer contact information is hidden before a completed order. Marketing consent is shown
      separately, and sensitive data cannot be exported in this demo.
    </div>
  );
}
function UpgradePanel({
  title,
  body,
  compact = false,
}: {
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-[var(--indigo)] text-[var(--ivory)] ${compact ? "p-6" : "p-8 md:p-10"}`}
    >
      <Sparkles className="h-7 w-7 text-[var(--terracotta)]" />
      <h2 className="mt-5 font-display text-4xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">{body}</p>
      <a
        href="/artist/dashboard/subscription"
        className="btn-primary mt-6 bg-[var(--terracotta)] !text-[var(--ink)]"
      >
        Compare plans
      </a>
    </div>
  );
}
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5 md:p-6">
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}
function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}
function DashboardField({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}
function DashboardToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-[var(--oxblood)]"
      />
    </label>
  );
}
function AnalyticsList({ title, items }: { title: string; items: string[][] }) {
  return (
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-3 space-y-3">
        {items.map(([label, value]) => (
          <div key={label}>
            <div className="flex justify-between text-xs">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[var(--ivory)]">
              <div className="h-full rounded-full bg-[var(--indigo)]" style={{ width: value }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
