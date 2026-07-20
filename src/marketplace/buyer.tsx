import { Link } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Eye,
  Heart,
  Home,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Package,
  Palette,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  User,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "./auth";
import { ARTWORKS, NOTIFICATIONS, ORDERS, STORES } from "./data";
import { formatPKR } from "./config";

const navigation = [
  ["Profile", "profile", User],
  ["Orders", "orders", ShoppingBag],
  ["Wishlist", "wishlist", Heart],
  ["Followed Artists", "followed-artists", Users],
  ["Messages", "messages", MessageCircle],
  ["Offers", "offers", Tag],
  ["Video Consultations", "video-consultations", Video],
  ["Addresses", "addresses", MapPin],
  ["Reviews", "reviews", Star],
  ["Notifications", "notifications", Bell],
  ["Security", "security", LockKeyhole],
  ["Settings", "settings", Settings],
] as const;

export function BuyerDashboard({ section = "profile" }: { section?: string }) {
  const { user, ready, logout } = useAuth();
  if (!ready)
    return (
      <div className="container-editorial py-16">
        <div className="h-96 animate-pulse rounded-2xl bg-[var(--porcelain)]" />
      </div>
    );
  if (!user || user.role !== "buyer")
    return (
      <div className="container-editorial flex min-h-[65vh] items-center justify-center py-14">
        <div className="max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-8 text-center">
          <LockKeyhole className="mx-auto h-9 w-9 text-[var(--oxblood)]" />
          <h1 className="mt-5 font-display text-4xl">Buyer sign-in required.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Use the buyer demo to test orders, saved work, messages and account settings.
          </p>
          <Link to="/auth/login" className="btn-primary mt-6">
            Sign in
          </Link>
        </div>
      </div>
    );
  const title = navigation.find((item) => item[1] === section)?.[0] ?? "Profile";
  return (
    <div className="min-h-[calc(100vh-var(--header-height))] bg-[#f2ede4]">
      <div className="container-editorial py-8">
        <div className="mb-6">
          <div className="eyebrow">Collector account</div>
          <h1 className="mt-2 font-display text-5xl">{title}</h1>
        </div>
        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-3 lg:sticky lg:top-28">
            <div className="border-b border-[var(--color-border)] p-3">
              <div className="font-semibold">{user.fullName}</div>
              <div className="mt-1 text-xs text-muted-foreground">{user.email}</div>
            </div>
            <nav
              className="no-scrollbar mt-3 flex gap-2 overflow-x-auto lg:grid"
              aria-label="Buyer account"
            >
              {navigation.map(([label, slug, Icon]) => (
                <a
                  key={slug}
                  href={slug === "profile" ? "/account" : `/account/${slug}`}
                  className={`flex min-h-11 min-w-max items-center gap-3 rounded-xl px-3 text-xs font-semibold ${section === slug ? "bg-[var(--ink)] text-[var(--ivory)]" : "hover:bg-[var(--ivory)]"}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </nav>
            <button
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
              className="mt-3 flex min-h-11 w-full items-center gap-3 border-t border-[var(--color-border)] px-3 pt-3 text-xs font-semibold text-muted-foreground"
            >
              <LockKeyhole className="h-4 w-4" />
              Log out
            </button>
          </aside>
          <main className="min-w-0">
            <BuyerSection section={section} />
          </main>
        </div>
      </div>
    </div>
  );
}

function BuyerSection({ section }: { section: string }) {
  switch (section) {
    case "orders":
      return <BuyerOrders />;
    case "wishlist":
      return <BuyerWishlist />;
    case "followed-artists":
      return <FollowedArtists />;
    case "messages":
      return <BuyerMessages />;
    case "offers":
      return <Offers />;
    case "video-consultations":
      return <Consultations />;
    case "addresses":
      return <Addresses />;
    case "reviews":
      return <BuyerReviews />;
    case "notifications":
      return <BuyerNotifications />;
    case "security":
      return <Security />;
    case "settings":
      return <BuyerSettings />;
    default:
      return <BuyerProfile />;
  }
}
function BuyerProfile() {
  return (
    <div className="space-y-6">
      <BuyerPanel>
        <div className="grid gap-7 md:grid-cols-[1fr_auto]">
          <div>
            <div className="eyebrow">Welcome back</div>
            <h2 className="mt-2 font-display text-4xl">Hamza, your collection is taking shape.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Continue a conversation, check your preparing order or revisit work saved for later.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="/discover" className="btn-primary">
                Explore Art
              </a>
              <a href="/account/orders" className="btn-ghost">
                Track order
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Orders", "2"],
              ["Saved", "12"],
              ["Following", "5"],
              ["Messages", "3"],
            ].map(([label, value]) => (
              <div key={label} className="min-w-28 rounded-xl bg-[var(--ivory)] p-4 text-center">
                <div className="font-display text-3xl">{value}</div>
                <div className="text-[10px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </BuyerPanel>
      <div className="grid gap-6 xl:grid-cols-2">
        <BuyerPanel>
          <div className="eyebrow">Recently viewed</div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {ARTWORKS.slice(0, 3).map((item) => (
              <a key={item.id} href={`/product/${item.slug}`}>
                <img
                  src={item.images[0].url}
                  alt={item.title}
                  className="aspect-[4/5] w-full rounded-lg object-cover"
                />
                <div className="mt-2 truncate text-xs font-semibold">{item.title}</div>
              </a>
            ))}
          </div>
        </BuyerPanel>
        <BuyerPanel>
          <div className="eyebrow">Buyer protection</div>
          <div className="mt-5 space-y-3">
            {[
              "Seller information stays inside ArtDera before purchase.",
              "Order status and delivery milestones are visible in your account.",
              "Return eligibility is shown before demo checkout.",
            ].map((value) => (
              <div
                key={value}
                className="flex gap-3 rounded-xl bg-[var(--ivory)] p-4 text-xs leading-relaxed"
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--indigo)]" />
                {value}
              </div>
            ))}
          </div>
        </BuyerPanel>
      </div>
    </div>
  );
}
function BuyerOrders() {
  const [status, setStatus] = useState("Preparing");
  return (
    <BuyerPanel>
      <div className="eyebrow">Orders</div>
      <div className="mt-5 space-y-4">
        {ORDERS.filter((order) => order.buyerId === "user-buyer").map((order) => (
          <article key={order.id} className="rounded-2xl border border-[var(--color-border)] p-5">
            <div className="grid gap-5 md:grid-cols-[90px_1fr_auto]">
              <img
                src={order.items[0].image}
                alt=""
                className="h-28 w-full rounded-lg object-cover"
              />
              <div>
                <div className="text-xs text-muted-foreground">{order.orderNumber}</div>
                <h2 className="mt-1 font-display text-2xl">{order.items[0].title}</h2>
                <div className="mt-2 text-sm font-semibold">{formatPKR(order.total)}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="chip">{status}</span>
                  <span className="chip">Delivery to {order.deliveryCity}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => toast.info("Tracking: DEMO-PAK-832109")}
                  className="btn-primary"
                >
                  Track order
                </button>
                <a href="/account/messages" className="btn-ghost">
                  Message artist
                </a>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-5 gap-1">
              {["Paid", "Confirmed", "Preparing", "Shipped", "Delivered"].map((label, index) => (
                <div key={label} className="text-center">
                  <div
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[10px] ${index <= 2 ? "bg-[var(--success)] text-white" : "bg-[var(--ivory)]"}`}
                  >
                    {index <= 2 ? <Check className="h-3 w-3" /> : index + 1}
                  </div>
                  <div className="mt-2 text-[9px] text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </BuyerPanel>
  );
}
function BuyerWishlist() {
  const [items, setItems] = useState(ARTWORKS.slice(0, 4));
  return (
    <BuyerPanel>
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">Saved artworks</div>
          <h2 className="mt-2 font-display text-3xl">{items.length} works to revisit</h2>
        </div>
        <a href="/discover" className="btn-ghost">
          Explore more
        </a>
      </div>
      {items.length ? (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
          {items.map((item) => (
            <article key={item.id}>
              <div className="relative">
                <a href={`/product/${item.slug}`}>
                  <img
                    src={item.images[0].url}
                    alt={item.title}
                    className="aspect-[4/5] w-full rounded-xl object-cover"
                  />
                </a>
                <button
                  onClick={() =>
                    setItems((values) => values.filter((value) => value.id !== item.id))
                  }
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--porcelain)]"
                  aria-label={`Remove ${item.title}`}
                >
                  <Heart className="h-4 w-4" fill="currentColor" />
                </button>
              </div>
              <div className="mt-3 font-display text-xl">{item.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{formatPKR(item.price)}</div>
            </article>
          ))}
        </div>
      ) : (
        <BuyerEmpty
          icon={Heart}
          title="Your wishlist is empty."
          body="Save work while you compare scale, colour and placement."
        />
      )}
    </BuyerPanel>
  );
}
function FollowedArtists() {
  return (
    <BuyerPanel>
      <div className="eyebrow">Followed stores</div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {STORES.map((store) => (
          <article
            key={store.id}
            className="overflow-hidden rounded-2xl border border-[var(--color-border)]"
          >
            <img src={store.coverImage} alt="" className="h-28 w-full object-cover" />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <img
                  src={store.profileImage}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-display text-xl">{store.name}</div>
                  <div className="text-xs text-muted-foreground">{store.location}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <a href={`/store/${store.slug}`} className="btn-primary flex-1">
                  View store
                </a>
                <button onClick={() => toast.success("Store unfollowed")} className="btn-ghost">
                  Following
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </BuyerPanel>
  );
}
function BuyerMessages() {
  const [text, setText] = useState("");
  return (
    <BuyerPanel>
      <div className="grid min-h-[540px] overflow-hidden rounded-xl border border-[var(--color-border)] md:grid-cols-[260px_1fr]">
        <aside className="border-b border-[var(--color-border)] p-3 md:border-b-0 md:border-r">
          <div className="rounded-xl bg-[var(--ivory)] p-3">
            <strong className="text-sm">Areeba Hasan</strong>
            <div className="mt-1 text-xs text-muted-foreground">About {ARTWORKS[0].title}</div>
            <div className="mt-2 text-[11px]">That would be helpful…</div>
          </div>
        </aside>
        <main className="flex flex-col">
          <div className="border-b border-[var(--color-border)] p-4">
            <strong>Areeba Hasan</strong>
            <div className="text-xs text-muted-foreground">Protected ArtDera conversation</div>
          </div>
          <div className="flex-1 space-y-3 p-4">
            {[
              "Hello, could you confirm whether the work arrives ready to hang?",
              "Yes — the hanging hardware is fitted. I can also share a short artwork video here.",
              "That would be helpful. Would you consider an offer of Rs. 72,000?",
            ].map((body, index) => (
              <div
                key={body}
                className={`max-w-[80%] rounded-2xl p-4 text-sm ${index === 1 ? "ml-auto bg-[var(--ink)] text-white" : "bg-[var(--ivory)]"}`}
              >
                {body}
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--color-border)] p-4">
            <div className="mb-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Keep phone, email, WhatsApp and payment links private before a confirmed order.
            </div>
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="art-field"
                placeholder="Write a message"
              />
              <button
                onClick={() => {
                  if (!text) return;
                  toast.success("Demo message sent");
                  setText("");
                }}
                className="btn-primary"
              >
                Send
              </button>
            </div>
          </div>
        </main>
      </div>
    </BuyerPanel>
  );
}
function Offers() {
  const [state, setState] = useState("Countered");
  return (
    <BuyerPanel>
      <div className="eyebrow">Offers</div>
      <article className="mt-5 grid gap-5 rounded-2xl border border-[var(--color-border)] p-5 sm:grid-cols-[100px_1fr_auto]">
        <img
          src={ARTWORKS[0].images[0].url}
          alt=""
          className="aspect-[4/5] w-full rounded-lg object-cover"
        />
        <div>
          <div className="font-display text-2xl">{ARTWORKS[0].title}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Listed at {formatPKR(ARTWORKS[0].price)}
          </div>
          <div className="mt-4 text-sm">
            Your offer <strong>Rs. 72,000</strong>
          </div>
          <div className="mt-2 text-sm">
            Artist counter <strong>Rs. 76,000</strong>
          </div>
        </div>
        <div>
          <span className="chip">{state}</span>
          <div className="mt-4 grid gap-2">
            <button
              onClick={() => {
                setState("Accepted");
                toast.success("Counter-offer accepted");
              }}
              className="btn-primary"
            >
              Accept
            </button>
            <button onClick={() => setState("Rejected")} className="btn-ghost">
              Decline
            </button>
          </div>
        </div>
      </article>
    </BuyerPanel>
  );
}
function Consultations() {
  return (
    <BuyerPanel>
      <div className="eyebrow">Video consultations</div>
      <div className="mt-5 rounded-2xl border border-[var(--color-border)] p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <div className="flex gap-2">
              <span className="chip">Accepted</span>
              <span className="chip">Demo request</span>
            </div>
            <h2 className="mt-4 font-display text-3xl">Artwork viewing with Areeba Hasan</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>
                <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                July 25, 2026 · 5:00 PM
              </span>
              <span>
                <Video className="mr-1 inline h-3.5 w-3.5" />
                Mock meeting link
              </span>
            </div>
          </div>
          <button
            onClick={() => toast.info("Meeting links will work when a provider is connected.")}
            className="btn-primary"
          >
            Open meeting link
          </button>
        </div>
      </div>
    </BuyerPanel>
  );
}
function Addresses() {
  const [editing, setEditing] = useState(false);
  return (
    <BuyerPanel>
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">Delivery addresses</div>
          <h2 className="mt-2 font-display text-3xl">Where art arrives.</h2>
        </div>
        <button onClick={() => setEditing(true)} className="btn-primary">
          Add address
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--oxblood)] p-5">
          <span className="chip">Default</span>
          <div className="mt-4 font-semibold">Home</div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            House 18, Street 7<br />
            F-7/2, Islamabad
            <br />
            Pakistan
          </p>
          <button onClick={() => setEditing(true)} className="mt-4 text-xs font-semibold underline">
            Edit address
          </button>
        </div>
        {editing && (
          <div className="rounded-2xl bg-[var(--ivory)] p-5">
            <div className="font-semibold">New address</div>
            <div className="mt-4 grid gap-3">
              <input className="art-field" placeholder="Address line" />
              <input className="art-field" placeholder="City" />
              <button
                onClick={() => {
                  setEditing(false);
                  toast.success("Demo address saved");
                }}
                className="btn-primary"
              >
                Save address
              </button>
            </div>
          </div>
        )}
      </div>
    </BuyerPanel>
  );
}
function BuyerReviews() {
  return (
    <BuyerPanel>
      <div className="eyebrow">Your reviews</div>
      <article className="mt-5 rounded-2xl border border-[var(--color-border)] p-5">
        <div className="flex text-amber-500">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className="h-4 w-4" fill="currentColor" />
          ))}
        </div>
        <h2 className="mt-3 font-semibold">Even better in the room</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The colours were accurately represented and the packing was careful.
        </p>
        <div className="mt-4 flex gap-3 text-xs">
          <button className="font-semibold underline">Edit</button>
          <button className="text-muted-foreground">Delete</button>
        </div>
      </article>
    </BuyerPanel>
  );
}
function BuyerNotifications() {
  const [items, setItems] = useState(NOTIFICATIONS.filter((item) => item.userId === "user-buyer"));
  return (
    <BuyerPanel>
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">Notifications</div>
          <h2 className="mt-2 font-display text-3xl">Updates that matter.</h2>
        </div>
        <button
          onClick={() => setItems((values) => values.map((item) => ({ ...item, read: true })))}
          className="btn-ghost"
        >
          Mark all read
        </button>
      </div>
      <div className="mt-5 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex gap-4 rounded-xl p-4 ${item.read ? "border border-[var(--color-border)]" : "bg-[var(--ivory)]"}`}
          >
            <Bell className="h-4 w-4 text-[var(--oxblood)]" />
            <div>
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{item.body}</div>
            </div>
          </div>
        ))}
      </div>
    </BuyerPanel>
  );
}
function Security() {
  return (
    <div className="space-y-6">
      <BuyerPanel>
        <div className="eyebrow">Password and sessions</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => (window.location.href = "/auth/forgot")}
            className="btn-ghost justify-start"
          >
            <LockKeyhole className="h-4 w-4" />
            Change password
          </button>
          <button
            onClick={() => toast.info("Other demo sessions signed out")}
            className="btn-ghost justify-start"
          >
            <ShieldCheck className="h-4 w-4" />
            Sign out other sessions
          </button>
        </div>
      </BuyerPanel>
      <BuyerPanel>
        <div className="eyebrow">Current session</div>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-[var(--ivory)] p-4">
          <div>
            <div className="font-semibold">This browser</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Pakistan · Active now · Expires after one hour
            </div>
          </div>
          <span className="chip">Current</span>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Frontend route guards and session simulation are not production security. Backend
          authorization is required.
        </p>
      </BuyerPanel>
    </div>
  );
}
function BuyerSettings() {
  return (
    <div className="space-y-6">
      <BuyerPanel>
        <div className="eyebrow">Preferences</div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label>
            <span className="eyebrow mb-2 block">Currency</span>
            <select className="art-field">
              <option>PKR</option>
              <option>USD preview</option>
            </select>
          </label>
          <label>
            <span className="eyebrow mb-2 block">Language</span>
            <select className="art-field">
              <option>English</option>
              <option>Urdu</option>
            </select>
          </label>
        </div>
        <button onClick={() => toast.success("Preferences saved")} className="btn-primary mt-6">
          Save preferences
        </button>
      </BuyerPanel>
      <BuyerPanel>
        <div className="eyebrow">Notification preferences</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            "Messages",
            "Offers",
            "Order updates",
            "Artist updates",
            "Saved artwork changes",
            "Recommendations",
          ].map((value) => (
            <label
              key={value}
              className="flex min-h-12 items-center justify-between rounded-xl border border-[var(--color-border)] px-4 text-sm"
            >
              <span>{value}</span>
              <input type="checkbox" defaultChecked className="accent-[var(--oxblood)]" />
            </label>
          ))}
        </div>
      </BuyerPanel>
    </div>
  );
}
function BuyerPanel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5 md:p-6">
      {children}
    </section>
  );
}
function BuyerEmpty({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="py-14 text-center">
      <Icon className="mx-auto h-8 w-8 text-[var(--oxblood)]" />
      <h2 className="mt-4 font-display text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <a href="/discover" className="btn-primary mt-5">
        Explore Art
      </a>
    </div>
  );
}
