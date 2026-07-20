import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Heart,
  MessageCircle,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Share2,
  Sparkles,
  Tag,
  Truck,
  Video,
  ZoomIn,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getProduct, getCreator, productsByCreator, formatPKR, PRODUCTS } from "@/lib/artdera";
import { ProductCard } from "@/components/site/ProductCard";
import { ViewInSpace } from "@/components/site/ViewInSpace";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/marketplace/auth";
import { ARTWORKS } from "@/marketplace/data";
import { CartService, MessageService, WishlistService } from "@/marketplace/services";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const p = getProduct(params.slug);
    return {
      meta: [
        { title: p ? `${p.title} - ArtDera` : "Artwork - ArtDera" },
        { name: "description", content: p?.description.slice(0, 155) },
        { property: "og:title", content: p?.title },
        { property: "og:type", content: "product" },
        { property: "og:url", content: p ? `/product/${p.slug}` : undefined },
        ...(p ? [{ property: "og:image" as const, content: p.images[0] }] : []),
      ],
      links: p ? [{ rel: "canonical", href: `/product/${p.slug}` }] : [],
      scripts: p
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                name: p.title,
                description: p.description,
                image: p.images,
                offers: {
                  "@type": "Offer",
                  priceCurrency: "PKR",
                  price: p.price,
                  availability: "https://schema.org/InStock",
                },
                brand: { "@type": "Person", name: getCreator(p.creatorSlug)?.name },
              }),
            },
          ]
        : [],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="container-editorial py-24 text-center">
      <h1 className="font-display text-4xl">Work not found</h1>
      <a href="/discover" className="btn-primary mt-6">
        Back to Discover
      </a>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const product = getProduct(slug);
  const { user } = useAuth();
  const [active, setActive] = useState(0);
  const [saved, setSaved] = useState(false);
  if (!product)
    return (
      <div className="container-editorial py-24 text-center">
        <h1 className="font-display text-4xl">Work not found</h1>
        <a href="/discover" className="btn-primary mt-6">
          Back to Discover
        </a>
      </div>
    );
  const creator = getCreator(product.creatorSlug)!;
  const artwork = ARTWORKS.find((item) => item.slug === product.slug);
  const more = productsByCreator(product.creatorSlug).filter((p) => p.slug !== product.slug);
  const similar = PRODUCTS.filter(
    (p) => p.slug !== product.slug && p.categorySlug === product.categorySlug,
  ).slice(0, 4);

  const requireBuyer = () => {
    if (!user) {
      window.location.assign(
        `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return false;
    }
    if (user.role !== "buyer") {
      toast.error("Use a buyer account for collecting actions.");
      return false;
    }
    return true;
  };

  const addToCart = async (buyNow = false) => {
    if (!requireBuyer() || !artwork) return;
    const result = await CartService.add(artwork.id);
    if (result.error) return toast.error(result.error.message);
    toast.success("Added to your secure cart");
    if (buyNow) window.location.assign("/checkout");
  };

  const toggleWishlist = async () => {
    if (!requireBuyer() || !artwork) return;
    const result = saved
      ? await WishlistService.remove(artwork.id)
      : await WishlistService.save(artwork.id);
    if (result.error) return toast.error(result.error.message);
    setSaved(!saved);
    toast.success(saved ? "Removed from wishlist" : "Saved to wishlist");
  };

  const conversation = async (message?: string) => {
    if (!requireBuyer() || !artwork) return undefined;
    const result = await MessageService.createConversation(artwork.storeId, artwork.id, message);
    if (result.error) toast.error(result.error.message);
    return result.data;
  };

  return (
    <div className="pb-20 lg:pb-0">
      <div className="container-editorial py-6 text-xs text-muted-foreground">
        <a href="/discover" className="hover:text-foreground">
          Discover
        </a>{" "}
        <span className="mx-1.5">/</span>
        <a href={`/discover?category=${product.categorySlug}`} className="hover:text-foreground">
          {product.categorySlug.replace(/-/g, " ")}
        </a>{" "}
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{product.title}</span>
      </div>

      <div className="container-editorial grid gap-10 pb-16 lg:grid-cols-[minmax(0,1.18fr)_minmax(380px,0.82fr)] lg:gap-16">
        <section aria-label={`${product.title} image gallery`}>
          <div className="relative overflow-hidden rounded-xl bg-secondary">
            <img
              src={product.images[active]}
              alt={product.title}
              className="aspect-[4/5] h-full w-full object-cover md:aspect-[5/6]"
            />
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="absolute bottom-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--porcelain)] px-4 text-sm font-semibold text-[var(--ink)] shadow-sm"
                >
                  <ZoomIn className="h-4 w-4" /> Zoom
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[calc(100vh-3rem)] max-w-5xl overflow-y-auto bg-[var(--ink)] p-0 text-white">
                <DialogHeader className="sr-only">
                  <DialogTitle>{product.title} enlarged image</DialogTitle>
                </DialogHeader>
                <img
                  src={product.images[active]}
                  alt={product.title}
                  className="h-auto max-h-[calc(100vh-3rem)] w-full object-contain"
                />
              </DialogContent>
            </Dialog>
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img: string, i: number) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${i === active ? "ring-[var(--oxblood)]" : "ring-transparent"}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
            <TrustNote
              icon={ShieldCheck}
              title="Protected purchase"
              text="Eligible orders include ArtDera support."
            />
            <TrustNote
              icon={Truck}
              title="Tracked delivery"
              text="Packed carefully with delivery updates."
            />
            <TrustNote
              icon={BadgeCheck}
              title="Clear disclosure"
              text="Creation type and edition details shown."
            />
          </div>
        </section>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap gap-2">
            <span className="chip" style={{ background: "var(--ink)", color: "var(--ivory)" }}>
              {product.kind}
              {product.editionOf ? ` / Ed. of ${product.editionOf}` : ""}
            </span>
            {creator.verified && (
              <span
                className="chip"
                style={{ background: "var(--indigo)", color: "var(--porcelain)" }}
              >
                Verified Seller
              </span>
            )}
            <span className="chip">{product.framed ? "Framed" : "Unframed"}</span>
          </div>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] md:text-5xl">{product.title}</h1>
          <Link
            to="/creator/$slug"
            params={{ slug: creator.slug }}
            className="mt-3 inline-block text-sm hover:underline"
          >
            by <span className="font-semibold">{creator.name}</span> / {creator.location}
          </Link>
          <div className="mt-6 font-display text-3xl">{formatPKR(product.price)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Processing 5-7 business days / Nationwide delivery
          </div>

          <div className="mt-7 space-y-3">
            <button
              type="button"
              onClick={() => void addToCart()}
              className="btn-primary w-full py-3.5"
            >
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </button>
            <button
              type="button"
              onClick={() => void addToCart(true)}
              className="btn-dark w-full py-3.5"
            >
              Buy Now
            </button>
            <ViewInSpace product={product} />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void toggleWishlist()}
                aria-pressed={saved}
                className="btn-ghost"
              >
                <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} /> Wishlist
              </button>
              <button
                type="button"
                onClick={() =>
                  void conversation().then(
                    (value) =>
                      value && window.location.assign(`/messages?conversation=${value.id}`),
                  )
                }
                className="btn-ghost"
              >
                <MessageCircle className="h-4 w-4" /> Message
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  void (async () => {
                    const value = window.prompt(
                      "Your offer in PKR",
                      String(Math.round(product.price * 0.9)),
                    );
                    const amount = Number(value);
                    if (!value || !Number.isFinite(amount) || amount <= 0) return;
                    const thread = await conversation();
                    if (!thread) return;
                    const result = await MessageService.createOffer(thread.id, amount);
                    result.error
                      ? toast.error(result.error.message)
                      : toast.success("Offer sent securely");
                  })()
                }
                className="btn-ghost"
              >
                <Tag className="h-4 w-4" /> Make an Offer
              </button>
              <button
                type="button"
                onClick={() =>
                  void (async () => {
                    const thread = await conversation();
                    if (!thread) return;
                    const date = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
                    const result = await MessageService.requestConsultation({
                      conversationId: thread.id,
                      requestedDate: date,
                      requestedTime: "17:00",
                      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    });
                    result.error
                      ? toast.error(result.error.message)
                      : toast.success("Video consultation requested");
                  })()
                }
                className="btn-ghost"
              >
                <Video className="h-4 w-4" /> Request Video
              </button>
            </div>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Artwork link copied");
              }}
              className="btn-ghost w-full"
            >
              <Share2 className="h-4 w-4" /> Share Artwork
            </button>
            <a
              href={`/discover?category=custom-commissions&q=${encodeURIComponent(product.title)}`}
              className="btn-ghost w-full"
            >
              Request Customization
            </a>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--color-border)] pt-6 text-xs">
            {[
              ["Medium", product.medium],
              ["Dimensions", product.dimensions],
              ["Year", product.year.toString()],
              ["Framing", product.framed ? "Included" : "Available on request"],
              ["Availability", "Available"],
              ["Certificate", "Declared by seller"],
              ["Colours", product.colours.join(", ")],
              ["Best for", product.room.join(", ")],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow">{k}</dt>
                <dd className="mt-1 text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4 text-[var(--indigo)]" /> Buyer protection
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>Seller identity and listing details are reviewed before publication.</li>
              <li>Return eligibility depends on product type, condition and delivery status.</li>
              <li>ArtDera can help resolve delivery, damage or listing-disclosure issues.</li>
            </ul>
          </div>
        </aside>
      </div>

      <section className="border-y border-[var(--color-border)] bg-[var(--porcelain)]">
        <div className="container-editorial grid gap-12 py-16 lg:grid-cols-[0.9fr_1.4fr]">
          <div>
            <div className="eyebrow">The Work</div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">Story, method and disclosure</h2>
          </div>
          <div>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {product.description}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={Ruler}
                title="Scale"
                text={`${product.dimensions}. Measure your wall and leave breathing room around the work.`}
              />
              <InfoCard
                icon={Sparkles}
                title="Creation Method"
                text={
                  product.kind === "AI-assisted"
                    ? "This listing is disclosed as AI-assisted."
                    : `${product.kind} work declared by the seller.`
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container-editorial section-y">
        <div className="grid items-center gap-10 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="relative aspect-[4/5] max-w-sm overflow-hidden rounded-xl">
            <img
              src={creator.portrait}
              alt={creator.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <div className="eyebrow">Creator</div>
            <h2 className="mt-3 font-display text-4xl">{creator.name}</h2>
            <div className="mt-1 text-sm text-muted-foreground">
              {creator.discipline} / {creator.location}
            </div>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {creator.bio}
            </p>
            <Link to="/creator/$slug" params={{ slug: creator.slug }} className="btn-ghost mt-6">
              Visit Studio Profile
            </Link>
          </div>
        </div>
      </section>

      {more.length > 0 && (
        <section className="container-editorial pb-16">
          <div className="eyebrow">More from {creator.name.split(" ")[0]}'s studio</div>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {more.slice(0, 4).map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="container-editorial pb-16">
          <div className="eyebrow">Similar in this category</div>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--porcelain)] p-3 shadow-[0_-12px_35px_rgba(23,23,23,0.08)] lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{product.title}</div>
            <div className="text-xs text-muted-foreground">{formatPKR(product.price)}</div>
          </div>
          <button
            type="button"
            onClick={() => void addToCart()}
            className="btn-primary shrink-0 px-4"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function TrustNote({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--porcelain)] p-4">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <Icon className="h-4 w-4 text-[var(--indigo)]" /> {title}
      </div>
      <p className="mt-1 leading-relaxed">{text}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Ruler;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white/45 p-5">
      <div className="flex items-center gap-2 font-semibold">
        <Icon className="h-4 w-4 text-[var(--oxblood)]" /> {title}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
