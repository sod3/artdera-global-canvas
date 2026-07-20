import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Filter,
  Heart,
  MapPin,
  MessageCircle,
  PackageCheck,
  Share2,
  ShieldCheck,
  Star,
  Truck,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ARTWORKS, STORES } from "@/marketplace/data";
import { ArtworkService, StoreService } from "@/marketplace/services";
import { formatPKR } from "@/marketplace/config";
import type { Artwork, Store } from "@/marketplace/types";

export const Route = createFileRoute("/store/$slug")({
  head: ({ params }) => {
    const store = STORES.find((item) => item.slug === params.slug);
    return {
      meta: [
        { title: `${store?.name ?? params.slug.replace(/-/g, " ")} — ArtDera Store` },
        {
          name: "description",
          content:
            store?.bio.slice(0, 155) ?? "Explore an artist or gallery storefront on ArtDera.",
        },
        { property: "og:title", content: store?.name },
        { property: "og:type", content: "profile" },
        { property: "og:image", content: store?.coverImage },
      ],
      links: [{ rel: "canonical", href: `/store/${params.slug}` }],
      scripts: store
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": store.id.includes("gallery") ? "ArtGallery" : "Person",
                name: store.name,
                description: store.bio,
                image: store.coverImage,
                address: store.location,
                url: `/store/${store.slug}`,
              }),
            },
          ]
        : [],
    };
  },
  component: Storefront,
});

function Storefront() {
  const { slug } = Route.useParams();
  const seeded = STORES.find((item) => item.slug === slug);
  const [store, setStore] = useState<Store | undefined>(seeded);
  const [followed, setFollowed] = useState(false);
  const [category, setCategory] = useState("All");
  const [availability, setAvailability] = useState("Available");
  const [framed, setFramed] = useState(false);
  const [maxPrice, setMaxPrice] = useState(300000);
  useEffect(() => setStore(StoreService.getBySlug(slug)), [slug]);
  const artworks = useMemo(
    () =>
      store
        ? ArtworkService.forStore(store.id).length
          ? ArtworkService.forStore(store.id)
          : ARTWORKS.filter((item) => item.storeId === store.id)
        : [],
    [store],
  );
  const visible = artworks.filter(
    (item) =>
      (category === "All" || item.category.toLowerCase().includes(category.toLowerCase())) &&
      (availability === "All" || availability === "Available"
        ? ["Published", "Reserved"].includes(item.status)
        : item.status === "Sold") &&
      (!framed || item.framed) &&
      item.price <= maxPrice,
  );
  if (!store)
    return (
      <div className="container-editorial py-24 text-center">
        <div className="eyebrow">Store not found</div>
        <h1 className="mt-3 font-display text-5xl">This studio is not on the wall.</h1>
        <a href="/creators" className="btn-primary mt-6">
          Explore Artists
        </a>
      </div>
    );
  return (
    <div className="pb-20">
      <section className="relative overflow-hidden bg-[var(--ink)] text-[var(--ivory)]">
        <img
          src={store.coverImage}
          alt={`${store.name} cover`}
          className="absolute inset-0 h-full w-full object-cover opacity-38"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/55 to-transparent" />
        <div className="container-editorial relative flex min-h-[490px] items-end py-10">
          <div className="grid w-full items-end gap-7 lg:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <img
                src={store.profileImage}
                alt={store.name}
                className="h-28 w-28 rounded-full border-4 border-white/20 object-cover shadow-xl"
              />
              <div>
                <div className="flex flex-wrap gap-2">
                  {store.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--indigo)] px-3 py-1 text-xs font-bold">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified Seller
                    </span>
                  )}
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{store.status}</span>
                </div>
                <h1 className="mt-4 font-display text-5xl md:text-6xl">{store.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/60">
                  <span>
                    <MapPin className="mr-1 inline h-3.5 w-3.5" />
                    {store.location}
                  </span>
                  <span>{store.followers.toLocaleString()} followers</span>
                  <span>
                    <Star className="mr-1 inline h-3.5 w-3.5 text-amber-400" fill="currentColor" />
                    {store.rating || "New"} ({store.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFollowed((value) => !value);
                  toast.success(followed ? "Store unfollowed" : "Store followed");
                }}
                className={
                  followed
                    ? "btn-primary bg-[var(--terracotta)] !text-[var(--ink)]"
                    : "btn-ghost !border-white/20 !text-white"
                }
              >
                {followed ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                {followed ? "Following" : "Follow"}
              </button>
              <ContactDialog store={store} />
              <VideoDialog />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Store link copied");
                }}
                className="btn-ghost !border-white/20 !text-white"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="border-b border-[var(--color-border)] bg-[var(--porcelain)]">
        <div className="container-editorial grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="eyebrow">About the store</div>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
              {store.bio}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {store.story}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Artworks", artworks.length],
              ["Available", artworks.filter((item) => item.status === "Published").length],
              ["Categories", store.categories.length],
              ["Response", "< 24h"],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl bg-[var(--ivory)] p-4">
                <div className="font-display text-3xl">{value}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container-editorial py-12">
        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5 lg:sticky lg:top-28">
            <div className="flex items-center justify-between">
              <div className="eyebrow">Filter work</div>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-5 space-y-5">
              <StoreFilter label="Category">
                <select
                  className="art-field"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option>All</option>
                  {store.categories.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </StoreFilter>
              <StoreFilter label="Availability">
                <select
                  className="art-field"
                  value={availability}
                  onChange={(event) => setAvailability(event.target.value)}
                >
                  <option>All</option>
                  <option>Available</option>
                  <option>Sold</option>
                </select>
              </StoreFilter>
              <StoreFilter label={`Maximum price · ${formatPKR(maxPrice)}`}>
                <input
                  type="range"
                  min="5000"
                  max="300000"
                  step="5000"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="w-full accent-[var(--oxblood)]"
                />
              </StoreFilter>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={framed}
                  onChange={(event) => setFramed(event.target.checked)}
                  className="accent-[var(--oxblood)]"
                />{" "}
                Framed only
              </label>
              <button
                onClick={() => {
                  setCategory("All");
                  setAvailability("Available");
                  setFramed(false);
                  setMaxPrice(300000);
                }}
                className="text-xs font-semibold underline"
              >
                Clear filters
              </button>
            </div>
          </aside>
          <main>
            <div className="flex items-end justify-between">
              <div>
                <div className="eyebrow">Available work</div>
                <h2 className="mt-2 font-display text-4xl">From the studio</h2>
              </div>
              <span className="text-xs text-muted-foreground">{visible.length} works</span>
            </div>
            {visible.length ? (
              <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-10 xl:grid-cols-3">
                {visible.map((artwork, index) => (
                  <StoreArtwork
                    key={artwork.id}
                    artwork={artwork}
                    sponsored={artwork.sponsored && index % 5 === 0}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-12 text-center">
                <PaletteIcon />
                <h3 className="mt-5 font-display text-3xl">No works match these filters.</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try a wider price or availability choice.
                </p>
                <button
                  onClick={() => {
                    setCategory("All");
                    setAvailability("All");
                    setFramed(false);
                    setMaxPrice(300000);
                  }}
                  className="btn-primary mt-5"
                >
                  Clear filters
                </button>
              </div>
            )}
          </main>
        </div>
      </section>
      <section className="border-y border-[var(--color-border)] bg-[var(--porcelain)]">
        <div className="container-editorial grid gap-5 py-12 md:grid-cols-3">
          {[
            [
              Truck,
              "Shipping information",
              "Domestic shipping estimates are shown per artwork. International availability depends on the listing and eligible plan.",
            ],
            [
              PackageCheck,
              "Returns",
              "Return eligibility depends on the artwork type, condition, delivery status and final reviewed policy.",
            ],
            [
              ShieldCheck,
              "Protected communication",
              "Email, phone and WhatsApp remain private until a confirmed order needs delivery coordination.",
            ],
          ].map(([Icon, title, body]) => {
            const ItemIcon = Icon as typeof Truck;
            return (
              <div key={title as string} className="rounded-2xl bg-[var(--ivory)] p-5">
                <ItemIcon className="h-5 w-5 text-[var(--indigo)]" />
                <h3 className="mt-4 font-display text-2xl">{title as string}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body as string}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="container-editorial py-12">
        <div className="flex items-end justify-between">
          <div>
            <div className="eyebrow">Collector reviews</div>
            <h2 className="mt-2 font-display text-4xl">Carefully delivered.</h2>
          </div>
          <span className="chip">{store.reviewCount} reviews</span>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            "The work arrived exactly as described and the packing was thoughtful.",
            "The artist answered every framing question without pressure.",
            "A calm buying experience from first message through delivery.",
          ].map((body, index) => (
            <article
              key={body}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5"
            >
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }, (_, star) => (
                  <Star key={star} className="h-3.5 w-3.5" fill="currentColor" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">“{body}”</p>
              <div className="mt-5 text-xs font-semibold">Verified buyer {index + 1}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function StoreArtwork({ artwork, sponsored }: { artwork: Artwork; sponsored: boolean }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="group">
      <a
        href={`/product/${artwork.slug}`}
        className="relative block overflow-hidden rounded-xl bg-[var(--porcelain)]"
      >
        <img
          src={artwork.images[0].url}
          alt={artwork.images[0].alt}
          className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.025]"
        />
        {sponsored && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--porcelain)] px-2.5 py-1 text-[10px] font-bold shadow-sm">
            Sponsored
          </span>
        )}
        {artwork.status === "Sold" && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-sm font-bold uppercase tracking-[0.18em] text-white">
            Sold
          </span>
        )}
      </a>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <a href={`/product/${artwork.slug}`} className="font-display text-xl hover:underline">
            {artwork.title}
          </a>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {artwork.medium} · {artwork.dimensions}
          </div>
          <div className="mt-2 text-sm font-semibold">{formatPKR(artwork.price)}</div>
        </div>
        <button
          onClick={() => setSaved((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-full border"
          aria-label={`Save ${artwork.title}`}
        >
          <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}
function ContactDialog({ store }: { store: Store }) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState("Ask a Question");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="btn-primary bg-[var(--terracotta)] !text-[var(--ink)]">
          <MessageCircle className="h-4 w-4" /> Message
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[var(--porcelain)]">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">Contact {store.name}</DialogTitle>
          <DialogDescription>
            Use protected ArtDera messages before purchase. Private contact details remain hidden.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid gap-4">
          <label>
            <span className="eyebrow mb-2 block">Request type</span>
            <select
              className="art-field"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              {[
                "Ask a Question",
                "Make an Offer",
                "Request More Images",
                "Request Artwork Video",
                "Request Video Consultation",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="eyebrow mb-2 block">Message</span>
            <textarea
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="art-field !rounded-xl"
              placeholder="Tell the artist what you would like to know."
            />
          </label>
          <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Do not include phone, email, WhatsApp or external payment links.
          </div>
          <button
            onClick={() => {
              if (!message.trim()) return toast.error("Write a message first.");
              toast.success(`${type} sent in demo mode`);
              setMessage("");
            }}
            className="btn-primary"
          >
            Send securely
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function VideoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="btn-ghost !border-white/20 !text-white">
          <Video className="h-4 w-4" /> Request Video Call
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[var(--porcelain)]">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">Request a video consultation</DialogTitle>
          <DialogDescription>
            Select a preferred time. The artist can accept, suggest another time or decline.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="eyebrow mb-2 block">Preferred date</span>
            <input type="date" className="art-field" defaultValue="2026-07-25" />
          </label>
          <label>
            <span className="eyebrow mb-2 block">Preferred time</span>
            <input type="time" className="art-field" defaultValue="17:00" />
          </label>
          <label className="sm:col-span-2">
            <span className="eyebrow mb-2 block">Message</span>
            <textarea rows={4} className="art-field !rounded-xl" />
          </label>
        </div>
        <button
          onClick={() => toast.success("Video consultation requested")}
          className="btn-primary mt-5"
        >
          Request consultation
        </button>
      </DialogContent>
    </Dialog>
  );
}
function StoreFilter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}
function PaletteIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ivory)]">
      <Filter className="h-6 w-6 text-[var(--oxblood)]" />
    </div>
  );
}
