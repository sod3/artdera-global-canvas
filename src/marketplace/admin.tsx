import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Bell,
  BookOpen,
  Boxes,
  Building2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  GalleryHorizontalEnd,
  Gavel,
  Image,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  MailWarning,
  Menu,
  MessageCircle,
  Package,
  Palette,
  Pencil,
  ReceiptText,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "./auth";
import {
  ADMIN_METRICS,
  ARTWORKS,
  AUDIT_LOG,
  ORDERS,
  PROMOTIONS,
  SEEDED_USERS,
  STORES,
} from "./data";
import { formatPKR, PLAN_ORDER, PLANS, PROMOTION_PLACEMENTS } from "./config";
import type { SubscriptionPlan } from "./types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const adminNavigation = [
  ["Overview", "overview", LayoutDashboard],
  ["Users", "users", Users],
  ["Artists", "artists", Palette],
  ["Galleries", "galleries", Building2],
  ["Buyers", "buyers", UserRoundCheck],
  ["Stores", "stores", Store],
  ["Artworks", "artworks", Image],
  ["Verification", "verification", BadgeCheck],
  ["Orders", "orders", ShoppingBag],
  ["Disputes", "disputes", Gavel],
  ["Returns", "returns", RotateCcw],
  ["Refunds", "refunds", ReceiptText],
  ["Promotions", "promotions", Sparkles],
  ["Sponsored Placements", "sponsored", Tag],
  ["Plans", "plans", CreditCard],
  ["Subscriptions", "subscriptions", ClipboardList],
  ["Payouts", "payouts", Banknote],
  ["Shipping", "shipping", Truck],
  ["Reviews", "reviews", Star],
  ["Messages & Reports", "messages-reports", MailWarning],
  ["Categories", "categories", Boxes],
  ["Collections", "collections", GalleryHorizontalEnd],
  ["Exhibitions", "exhibitions", BookOpen],
  ["Corporate Leads", "corporate-leads", Users],
  ["Content Management", "content", FileText],
  ["Notifications", "notifications", Bell],
  ["Support Tickets", "support", LifeBuoy],
  ["Analytics", "analytics", Activity],
  ["Audit Log", "audit-log", ShieldCheck],
  ["Settings", "settings", Settings],
] as const;

export function AdminDashboard({ section = "overview" }: { section?: string }) {
  const { user, ready, logout } = useAuth();
  if (!ready)
    return (
      <div className="container-editorial py-14">
        <div className="h-[600px] animate-pulse rounded-2xl bg-[var(--ink)]/80" />
      </div>
    );
  if (!user || user.role !== "admin")
    return (
      <div className="container-editorial flex min-h-[65vh] items-center justify-center py-14">
        <div className="max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-8 text-center">
          <LockKeyhole className="mx-auto h-9 w-9 text-[var(--oxblood)]" />
          <h1 className="mt-5 font-display text-4xl">Admin access required.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The admin route is intentionally absent from public navigation. Frontend role checks
            must be replaced by backend authorization before production.
          </p>
          <Link to="/auth/login" className="btn-primary mt-6">
            Sign in
          </Link>
        </div>
      </div>
    );
  const title = adminNavigation.find((item) => item[1] === section)?.[0] ?? "Overview";
  return (
    <div className="min-h-[calc(100vh-var(--header-height))] bg-[#eeebe5]">
      <div className="container-editorial py-5">
        <div className="mb-5 flex items-center justify-between rounded-xl bg-[var(--ink)] p-3 text-[var(--ivory)] xl:hidden">
          <div>
            <div className="text-[10px] uppercase tracking-[.16em] text-white/40">
              ArtDera admin
            </div>
            <div className="font-semibold">{title}</div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15"
                aria-label="Open admin navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-[var(--ink)] p-0 text-white">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin navigation</SheetTitle>
              </SheetHeader>
              <AdminNavigation section={section} logout={logout} />
            </SheetContent>
          </Sheet>
        </div>
        <div className="grid gap-5 xl:grid-cols-[270px_1fr]">
          <aside className="sticky top-[calc(var(--header-height)+1.25rem)] hidden h-[calc(100vh-var(--header-height)-2.5rem)] overflow-hidden rounded-2xl bg-[var(--ink)] text-[var(--ivory)] xl:block">
            <AdminNavigation section={section} logout={logout} />
          </aside>
          <main className="min-w-0">
            <div className="mb-6">
              <div className="eyebrow">Operations workspace · Frontend simulation</div>
              <h1 className="mt-2 font-display text-5xl">{title}</h1>
            </div>
            <AdminSection section={section} />
          </main>
        </div>
      </div>
    </div>
  );
}
function AdminNavigation({ section, logout }: { section: string; logout: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-5">
        <div className="eyebrow !text-white/35">ArtDera operations</div>
        <div className="mt-2 font-display text-2xl">Admin console</div>
        <div className="mt-1 text-[11px] text-amber-200/60">Simulation — not real security</div>
      </div>
      <nav className="no-scrollbar flex-1 overflow-y-auto p-3" aria-label="Admin dashboard">
        <div className="grid gap-0.5">
          {adminNavigation.map(([label, slug, Icon]) => (
            <a
              key={slug}
              href={slug === "overview" ? "/admin" : `/admin/${slug}`}
              className={`flex min-h-9 items-center gap-3 rounded-lg px-3 text-[11px] font-semibold ${section === slug ? "bg-[var(--terracotta)] text-[var(--ink)]" : "text-white/58 hover:bg-white/8 hover:text-white"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </a>
          ))}
        </div>
      </nav>
      <button
        onClick={() => {
          logout();
          window.location.href = "/";
        }}
        className="m-3 flex min-h-10 items-center gap-3 rounded-xl border-t border-white/10 px-3 text-xs text-white/55"
      >
        <LockKeyhole className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
function AdminSection({ section }: { section: string }) {
  switch (section) {
    case "overview":
      return <AdminOverview />;
    case "users":
    case "artists":
    case "galleries":
    case "buyers":
    case "stores":
      return <UserManagement type={section} />;
    case "artworks":
      return <ArtworkModeration />;
    case "verification":
      return <VerificationQueue />;
    case "promotions":
    case "sponsored":
      return <PromotionModeration />;
    case "plans":
      return <PlansManagement />;
    case "orders":
    case "disputes":
    case "returns":
    case "refunds":
      return <OrderOperations section={section} />;
    case "payouts":
    case "shipping":
    case "subscriptions":
      return <FinancialOperations section={section} />;
    case "audit-log":
      return <AuditLog />;
    case "settings":
      return <AdminSecurity />;
    default:
      return <GenericAdminSection section={section} />;
  }
}
function AdminOverview() {
  const metrics = [
    ["Total users", ADMIN_METRICS.totalUsers, Users],
    ["Active artists", ADMIN_METRICS.activeArtists, Palette],
    ["Galleries", ADMIN_METRICS.galleries, Building2],
    ["Buyers", ADMIN_METRICS.buyers, UserRoundCheck],
    ["Published artworks", ADMIN_METRICS.publishedArtworks, Image],
    ["Pending artworks", ADMIN_METRICS.pendingArtworks, AlertTriangle],
    ["Verification requests", ADMIN_METRICS.pendingVerification, BadgeCheck],
    ["Orders", ADMIN_METRICS.orders, ShoppingBag],
    ["Open disputes", ADMIN_METRICS.openDisputes, Gavel],
    ["Pending payouts", ADMIN_METRICS.pendingPayouts, Banknote],
  ] as const;
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-[var(--indigo)] p-6 text-[var(--ivory)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="eyebrow !text-white/40">Today in ArtDera</div>
            <h2 className="mt-3 font-display text-4xl">
              Review the queues that protect marketplace trust.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/62">
              74 artworks, 29 verification requests and 7 disputes need attention. Every action is
              logged in this frontend simulation.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["GMV", ADMIN_METRICS.gmv],
              ["Subscription revenue", ADMIN_METRICS.subscriptionRevenue],
              ["Commission revenue", ADMIN_METRICS.commissionRevenue],
              ["Promotion revenue", ADMIN_METRICS.promotionRevenue],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl bg-white/8 p-4">
                <div className="text-[10px] text-white/45">{label}</div>
                <div className="mt-2 font-display text-xl">{formatPKR(Number(value))}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map(([label, value, Icon]) => (
          <AdminPanel key={label} compact>
            <div className="flex justify-between">
              <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
              <Icon className="h-4 w-4 text-[var(--oxblood)]" />
            </div>
            <div className="mt-3 font-display text-3xl">{Number(value).toLocaleString()}</div>
          </AdminPanel>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel>
          <div className="eyebrow">Moderation queue</div>
          <div className="mt-5 space-y-3">
            {[
              ["Artwork review", 74, "/admin/artworks"],
              ["Verification", 29, "/admin/verification"],
              ["Promotion approval", 12, "/admin/promotions"],
              ["Open disputes", 7, "/admin/disputes"],
            ].map(([label, count, href]) => (
              <a
                key={label as string}
                href={href as string}
                className="flex min-h-14 items-center justify-between rounded-xl bg-[var(--ivory)] px-4"
              >
                <div>
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-[11px] text-muted-foreground">Oldest item: 18 hours</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-2xl">{count}</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </a>
            ))}
          </div>
        </AdminPanel>
        <AdminPanel>
          <div className="eyebrow">Recent actions</div>
          <div className="mt-5 space-y-4">
            {AUDIT_LOG.map((log) => (
              <div key={log.id} className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--indigo)]" />
                <div>
                  <div className="text-sm font-semibold capitalize">
                    {log.action.replace(/_/g, " ")} {log.entityType}
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {log.summary}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
function UserManagement({ type }: { type: string }) {
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const rows = useMemo(
    () =>
      SEEDED_USERS.filter(
        (user) =>
          (type === "users" ||
            type === `${user.role}s` ||
            (type === "galleries" && user.role === "gallery")) &&
          (!query ||
            `${user.fullName} ${user.email} ${user.city}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [query, type],
  );
  return (
    <AdminPanel>
      <div className="flex flex-col justify-between gap-4 lg:flex-row">
        <div>
          <div className="eyebrow">Account directory</div>
          <h2 className="mt-2 font-display text-3xl">
            {rows.length} demo {type}
          </h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="art-field pl-10"
            placeholder="Search accounts"
          />
        </div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="p-3">Account</th>
              <th className="p-3">Role</th>
              <th className="p-3">Location</th>
              <th className="p-3">Created</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-3">
                  <strong>{user.fullName}</strong>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </td>
                <td className="p-3 capitalize">{user.role}</td>
                <td className="p-3">{user.city}</td>
                <td className="p-3">{user.createdAt}</td>
                <td className="p-3">
                  <AdminStatus status={statuses[user.id] ?? "Active"} />
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toast.info("Profile opened in demo")}
                      className="admin-action"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        const next = statuses[user.id] === "Suspended" ? "Active" : "Suspended";
                        setStatuses((current) => ({ ...current, [user.id]: next }));
                        toast.success(`Account ${next.toLowerCase()}`);
                      }}
                      className="admin-action"
                    >
                      {statuses[user.id] === "Suspended" ? "Reactivate" : "Suspend"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPanel>
  );
}
function ArtworkModeration() {
  const [states, setStates] = useState<Record<string, string>>(
    Object.fromEntries(ARTWORKS.map((item) => [item.id, item.status])),
  );
  const [active, setActive] = useState(
    ARTWORKS.find((item) => item.status === "Pending Review") ?? ARTWORKS[0],
  );
  function act(status: string) {
    setStates((current) => ({ ...current, [active.id]: status }));
    toast.success(`${active.title}: ${status}`, {
      description: "Admin action added to the demo audit log.",
    });
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <AdminPanel>
        <div className="eyebrow">Review queue</div>
        <div className="mt-4 space-y-2">
          {ARTWORKS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item)}
              className={`flex w-full gap-3 rounded-xl p-3 text-left ${active.id === item.id ? "bg-[var(--ivory)]" : "border border-[var(--color-border)]"}`}
            >
              <img src={item.images[0].url} alt="" className="h-14 w-12 rounded object-cover" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{item.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.creatorName}</div>
                <div className="mt-1">
                  <AdminStatus status={states[item.id]} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </AdminPanel>
      <AdminPanel>
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <img
            src={active.images[0].url}
            alt={active.title}
            className="aspect-[4/5] w-full rounded-xl object-cover"
          />
          <div>
            <div className="eyebrow">Artwork review</div>
            <h2 className="mt-2 font-display text-4xl">{active.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {active.description}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
              {[
                ["Artist", active.creatorName],
                ["Category", active.category],
                ["Medium", active.medium],
                ["Price", formatPKR(active.price)],
                ["Dimensions", active.dimensions],
                ["Certificate", active.certificate ? "Declared" : "No"],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl bg-[var(--ivory)] p-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => act("Published")} className="btn-primary">
                Approve
              </button>
              <button onClick={() => act("Changes Requested")} className="btn-ghost">
                Request changes
              </button>
              <button onClick={() => act("Rejected")} className="btn-ghost">
                Reject
              </button>
              <button onClick={() => act("Duplicate Flagged")} className="btn-ghost">
                Flag duplicate
              </button>
              <button onClick={() => act("Prohibited Flagged")} className="btn-ghost">
                Flag prohibited
              </button>
              <button onClick={() => act("Archived")} className="btn-ghost">
                Archive
              </button>
            </div>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
function VerificationQueue() {
  const [status, setStatus] = useState("Pending Review");
  return (
    <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
      <AdminPanel>
        <div className="eyebrow">29 pending requests</div>
        <button className="mt-4 w-full rounded-xl bg-[var(--ivory)] p-4 text-left">
          <strong>Areeba Hasan</strong>
          <div className="mt-1 text-xs text-muted-foreground">Professional Artist · Lahore</div>
          <div className="mt-2">
            <AdminStatus status={status} />
          </div>
        </button>
      </AdminPanel>
      <AdminPanel>
        <div className="flex items-start justify-between">
          <div>
            <div className="eyebrow">Artist verification</div>
            <h2 className="mt-2 font-display text-4xl">Areeba Hasan</h2>
          </div>
          <AdminStatus status={status} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["Email", "Verified"],
            ["Phone", "Verified"],
            ["Identity information", "Submitted"],
            ["Portfolio", "12 works"],
            ["Ownership declaration", "Confirmed"],
            ["Complaints", "None"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[var(--ivory)] p-4">
              <div className="text-[11px] text-muted-foreground">{label}</div>
              <div className="mt-2 text-sm font-semibold">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStatus("Approved");
              toast.success("Verification approved");
            }}
            className="btn-primary"
          >
            Approve verification
          </button>
          <button onClick={() => setStatus("Changes Requested")} className="btn-ghost">
            Request changes
          </button>
          <button onClick={() => setStatus("Rejected")} className="btn-ghost">
            Reject
          </button>
          <button onClick={() => setStatus("Not Verified")} className="btn-ghost">
            Remove badge
          </button>
        </div>
      </AdminPanel>
    </div>
  );
}
function PromotionModeration() {
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(PROMOTIONS.map((item) => [item.id, item.status])),
  );
  return (
    <AdminPanel>
      <div className="eyebrow">Sponsored placement requests</div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {PROMOTIONS.map((promotion) => {
          const artwork = ARTWORKS.find((item) => item.id === promotion.artworkId);
          const placement = PROMOTION_PLACEMENTS.find((item) => item.id === promotion.placementId);
          return (
            <article
              key={promotion.id}
              className="rounded-xl border border-[var(--color-border)] p-4"
            >
              <div className="flex gap-3">
                <img
                  src={artwork?.images[0].url}
                  alt=""
                  className="h-20 w-16 rounded object-cover"
                />
                <div>
                  <div className="text-sm font-semibold">{placement?.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{artwork?.title}</div>
                  <div className="mt-2">
                    <AdminStatus status={statuses[promotion.id]} />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                {[
                  ["Price", formatPKR(promotion.price)],
                  ["Start", promotion.startDate],
                  ["End", promotion.endDate],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-[var(--ivory)] p-3">
                    <div className="text-[9px] text-muted-foreground">{label}</div>
                    <div className="mt-1 font-semibold">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setStatuses((current) => ({ ...current, [promotion.id]: "Scheduled" }));
                    toast.success("Placement approved and scheduled");
                  }}
                  className="admin-action"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    setStatuses((current) => ({ ...current, [promotion.id]: "Rejected" }))
                  }
                  className="admin-action"
                >
                  Reject
                </button>
                <button
                  onClick={() =>
                    setStatuses((current) => ({ ...current, [promotion.id]: "Active" }))
                  }
                  className="admin-action"
                >
                  Mark active
                </button>
                <button
                  onClick={() =>
                    setStatuses((current) => ({ ...current, [promotion.id]: "Completed" }))
                  }
                  className="admin-action"
                >
                  Complete
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-5 flex gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Marketplace display rule: maximum 20% sponsored results and no more than one sponsored
        artwork in every five cards.
      </div>
    </AdminPanel>
  );
}
function PlansManagement() {
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>(PLANS);
  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-xs text-amber-900">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Plan configuration is centralized. Changes here are local UI simulations and do not process
        subscription payments.
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {PLAN_ORDER.map((id) => {
          const plan = plans[id];
          return (
            <AdminPanel key={id}>
              <div className="flex justify-between">
                <div>
                  <div className="eyebrow">Plan configuration</div>
                  <h2 className="mt-2 font-display text-3xl">{plan.name}</h2>
                </div>
                {plan.recommended && <span className="chip">Recommended</span>}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <AdminField label="Plan name">
                  <input
                    className="art-field"
                    value={plan.name}
                    onChange={(event) =>
                      setPlans((current) => ({
                        ...current,
                        [id]: { ...plan, name: event.target.value },
                      }))
                    }
                  />
                </AdminField>
                <AdminField label="Monthly price">
                  <input
                    type="number"
                    className="art-field"
                    value={plan.monthlyPrice}
                    onChange={(event) =>
                      setPlans((current) => ({
                        ...current,
                        [id]: { ...plan, monthlyPrice: Number(event.target.value) },
                      }))
                    }
                  />
                </AdminField>
                <AdminField label="Annual price">
                  <input
                    type="number"
                    className="art-field"
                    value={plan.annualPrice ?? 0}
                    onChange={(event) =>
                      setPlans((current) => ({
                        ...current,
                        [id]: { ...plan, annualPrice: Number(event.target.value) || undefined },
                      }))
                    }
                  />
                </AdminField>
                <AdminField label="Listing limit">
                  <input
                    type="number"
                    className="art-field"
                    value={plan.listingLimit ?? 0}
                    onChange={(event) =>
                      setPlans((current) => ({
                        ...current,
                        [id]: { ...plan, listingLimit: Number(event.target.value) || null },
                      }))
                    }
                  />
                </AdminField>
                <AdminField label="Commission %">
                  <input
                    type="number"
                    step="0.5"
                    className="art-field"
                    value={plan.commission}
                    onChange={(event) =>
                      setPlans((current) => ({
                        ...current,
                        [id]: { ...plan, commission: Number(event.target.value) },
                      }))
                    }
                  />
                </AdminField>
                <AdminField label="Payout time">
                  <input
                    className="art-field"
                    value={plan.payoutTime}
                    onChange={(event) =>
                      setPlans((current) => ({
                        ...current,
                        [id]: { ...plan, payoutTime: event.target.value },
                      }))
                    }
                  />
                </AdminField>
              </div>
              <button
                onClick={() => toast.success(`${plan.name} plan saved in demo`)}
                className="btn-primary mt-5"
              >
                Save plan
              </button>
            </AdminPanel>
          );
        })}
      </div>
    </div>
  );
}
function OrderOperations({ section }: { section: string }) {
  const data = section === "orders" ? ORDERS : ORDERS.filter((_, index) => index === 0);
  return (
    <AdminPanel>
      <div className="flex justify-between">
        <div>
          <div className="eyebrow">{section} queue</div>
          <h2 className="mt-2 font-display text-3xl">{data.length} demo records</h2>
        </div>
        <select className="art-field !w-auto">
          <option>All statuses</option>
          <option>Needs attention</option>
        </select>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3">Order</th>
              <th className="p-3">Artwork</th>
              <th className="p-3">Buyer</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="p-3 font-semibold">{order.orderNumber}</td>
                <td className="p-3">{order.items[0].title}</td>
                <td className="p-3">Buyer {order.buyerId.slice(-4)}</td>
                <td className="p-3">{formatPKR(order.total)}</td>
                <td className="p-3">
                  <AdminStatus status={section === "disputes" ? "Open dispute" : order.status} />
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toast.info(`${section} case opened`)}
                    className="admin-action"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPanel>
  );
}
function FinancialOperations({ section }: { section: string }) {
  const cards =
    section === "payouts"
      ? [
          ["Pending", "Rs. 4.2m"],
          ["Available", "Rs. 1.8m"],
          ["On hold", "Rs. 284k"],
          ["Paid this month", "Rs. 12.6m"],
        ]
      : section === "shipping"
        ? [
            ["Awaiting pickup", "42"],
            ["In transit", "184"],
            ["Delayed", "7"],
            ["Delivered today", "63"],
          ]
        : [
            ["Active", "912"],
            ["Past due", "18"],
            ["Cancelled", "74"],
            ["MRR", "Rs. 3.42m"],
          ];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <AdminPanel key={label} compact>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-3 font-display text-3xl">{value}</div>
          </AdminPanel>
        ))}
      </div>
      <AdminPanel>
        <div className="eyebrow">{section} operations</div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl bg-[var(--ivory)] p-4"
            >
              <div>
                <div className="text-sm font-semibold">
                  {section.toUpperCase()}-DEMO-{1040 + index}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Updated {index + 1} hours ago
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AdminStatus status={index === 0 ? "Needs review" : "On schedule"} />
                <button onClick={() => toast.info("Demo record opened")} className="admin-action">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
function AuditLog() {
  return (
    <AdminPanel>
      <div className="flex justify-between">
        <div>
          <div className="eyebrow">Admin audit trail</div>
          <h2 className="mt-2 font-display text-3xl">Recent simulated actions</h2>
        </div>
        <button
          onClick={() => toast.info("Audit export disabled in frontend demo")}
          className="btn-ghost"
        >
          Export disabled
        </button>
      </div>
      <div className="mt-5 space-y-3">
        {AUDIT_LOG.map((log) => (
          <div
            key={log.id}
            className="grid gap-3 rounded-xl border border-[var(--color-border)] p-4 sm:grid-cols-[160px_1fr_auto]"
          >
            <div>
              <AdminStatus status={log.action.replace(/_/g, " ")} />
              <div className="mt-2 text-[10px] text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold">
                {log.entityType} · {log.entityId}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{log.summary}</div>
            </div>
            <div className="text-xs text-muted-foreground">{log.actorId}</div>
          </div>
        ))}
      </div>
    </AdminPanel>
  );
}
function AdminSecurity() {
  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-xl bg-red-50 p-4 text-xs leading-relaxed text-red-900">
        <LockKeyhole className="h-4 w-4 shrink-0" />
        These controls are visual simulations only. Real 2FA, session revocation, permissions and
        account locks require backend enforcement.
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <AdminPanel>
          <div className="eyebrow">Admin security</div>
          <div className="mt-5 space-y-3">
            {[
              ["Two-factor authentication", "Not connected"],
              ["Account lock", "Unlocked"],
              ["Password age", "Demo only"],
              ["Recovery methods", "Not connected"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl bg-[var(--ivory)] p-4 text-sm"
              >
                <span>{label}</span>
                <AdminStatus status={value} />
              </div>
            ))}
          </div>
          <button
            onClick={() => toast.info("2FA setup requires backend authentication")}
            className="btn-primary mt-5"
          >
            Configure two-factor
          </button>
        </AdminPanel>
        <AdminPanel>
          <div className="eyebrow">Active sessions</div>
          <div className="mt-5 space-y-3">
            {[
              ["This browser", "Islamabad, Pakistan", "Current"],
              ["Demo desktop", "Karachi, Pakistan", "2 hours ago"],
            ].map(([device, location, status]) => (
              <div key={device} className="rounded-xl border border-[var(--color-border)] p-4">
                <div className="flex justify-between">
                  <strong className="text-sm">{device}</strong>
                  <AdminStatus status={status} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{location}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => toast.success("Other demo sessions signed out")}
            className="btn-ghost mt-5"
          >
            Sign out all other sessions
          </button>
        </AdminPanel>
        <AdminPanel>
          <div className="eyebrow">Role permissions</div>
          <div className="mt-5 grid gap-3">
            {[
              "Super Admin",
              "Marketplace Operations",
              "Trust & Safety",
              "Finance",
              "Content Manager",
              "Support",
            ].map((role) => (
              <button
                key={role}
                onClick={() => toast.info(`${role} permissions opened`)}
                className="flex min-h-12 items-center justify-between rounded-xl bg-[var(--ivory)] px-4 text-sm font-semibold"
              >
                {role}
                <Pencil className="h-4 w-4" />
              </button>
            ))}
          </div>
        </AdminPanel>
        <AdminPanel>
          <div className="eyebrow">Login activity</div>
          <div className="mt-5 space-y-3">
            {[
              "Successful sign-in · This browser",
              "Failed attempt blocked · Demo IP",
              "Session refreshed · This browser",
            ].map((value, index) => (
              <div
                key={value}
                className="flex gap-3 rounded-xl border border-[var(--color-border)] p-4 text-sm"
              >
                <ShieldCheck
                  className={`h-4 w-4 ${index === 1 ? "text-[var(--destructive)]" : "text-[var(--success)]"}`}
                />
                {value}
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
function GenericAdminSection({ section }: { section: string }) {
  const label = adminNavigation.find((item) => item[1] === section)?.[0] ?? section;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Active records", "128"],
          ["Needs attention", "7"],
          ["Updated today", "34"],
        ].map(([title, value]) => (
          <AdminPanel key={title} compact>
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="mt-3 font-display text-3xl">{value}</div>
          </AdminPanel>
        ))}
      </div>
      <AdminPanel>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="eyebrow">{label}</div>
            <h2 className="mt-2 font-display text-3xl">Manage {label.toLowerCase()}</h2>
          </div>
          <button
            onClick={() => toast.success(`New ${label.toLowerCase()} demo record created`)}
            className="btn-primary"
          >
            Create new
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-4"
            >
              <div>
                <div className="text-sm font-semibold">
                  {label} record {index + 1}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Realistic demo state · Updated today
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AdminStatus status={index === 0 ? "Needs review" : "Active"} />
                <button
                  onClick={() => toast.info(`${label} record opened`)}
                  className="admin-action"
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
function AdminPanel({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <section
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] ${compact ? "p-5" : "p-5 md:p-6"}`}
    >
      {children}
    </section>
  );
}
function AdminStatus({ status }: { status: string }) {
  const positive = /Active|Approved|Published|Verified|Current|schedule|Completed|Unlocked/i.test(
    status,
  );
  const warning = /Pending|Review|Requested|Preparing|Invited|Not connected|Needs|Open/i.test(
    status,
  );
  const negative = /Rejected|Suspended|Failed|Past due|Dispute/i.test(status);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${positive ? "bg-emerald-50 text-emerald-800" : warning ? "bg-amber-50 text-amber-900" : negative ? "bg-red-50 text-red-800" : "bg-[var(--ivory)] text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}
function AdminField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}
