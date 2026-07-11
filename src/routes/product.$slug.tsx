import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProduct, getCreator, productsByCreator, formatPKR, PRODUCTS } from "@/lib/artdera";
import { ProductCard } from "@/components/site/ProductCard";
import { useState } from "react";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    return {
      meta: [
        { title: p ? `${p.title} — ArtDera` : "Artwork — ArtDera" },
        { name: "description", content: p?.description.slice(0, 155) },
        { property: "og:title", content: p?.title },
        { property: "og:type", content: "product" },
        { property: "og:url", content: p ? `/product/${p.slug}` : undefined },
        ...(p ? [{ property: "og:image" as const, content: p.images[0] }] : []),
      ],
      links: p ? [{ rel: "canonical", href: `/product/${p.slug}` }] : [],
      scripts: p ? [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.title,
          description: p.description,
          image: p.images,
          offers: { "@type": "Offer", priceCurrency: "PKR", price: p.price, availability: "https://schema.org/InStock" },
          brand: { "@type": "Person", name: getCreator(p.creatorSlug)?.name },
        }),
      }] : [],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="container-editorial py-24 text-center">
      <h1 className="font-display text-4xl">Work not found</h1>
      <a href="/discover" className="btn-primary mt-6">Back to Discover</a>
    </div>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const creator = getCreator(product.creatorSlug)!;
  const [active, setActive] = useState(0);
  const more = productsByCreator(product.creatorSlug).filter((p) => p.slug !== product.slug);
  const similar = PRODUCTS.filter((p) => p.slug !== product.slug && p.categorySlug === product.categorySlug).slice(0, 4);

  return (
    <div>
      <div className="container-editorial py-8 text-xs text-muted-foreground">
        <a href="/discover">Discover</a> <span className="mx-1.5">/</span>
        <a href={`/discover?category=${product.categorySlug}`}>{product.categorySlug.replace(/-/g, " ")}</a> <span className="mx-1.5">/</span>
        <span className="text-foreground">{product.title}</span>
      </div>

      <div className="container-editorial grid lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16 pb-16">
        {/* Gallery */}
        <div>
          <div className="relative overflow-hidden rounded-lg bg-secondary aspect-[4/5]">
            <img src={product.images[active]} alt={product.title} className="h-full w-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActive(i)} className={`h-20 w-20 rounded overflow-hidden ring-1 transition ${i === active ? "ring-foreground" : "ring-border"}`}>
                  <img src={img} alt="" className="h-full w-full object-cover"/>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex gap-2 flex-wrap">
            <span className="chip" style={{ background: "var(--ink)", color: "var(--ivory)" }}>{product.kind}{product.editionOf ? ` · Ed. of ${product.editionOf}` : ""}</span>
            {creator.verified && <span className="chip" style={{ background: "var(--indigo)", color: "var(--porcelain)" }}>✓ Verified Seller</span>}
            {product.framed && <span className="chip">Framed</span>}
          </div>
          <h1 className="mt-4 font-display text-4xl md:text-5xl leading-[1.05]">{product.title}</h1>
          <Link to="/creator/$slug" params={{ slug: creator.slug }} className="mt-3 inline-block text-sm hover:underline">
            by <span className="font-semibold">{creator.name}</span> · {creator.location}
          </Link>
          <div className="mt-6 font-display text-3xl">{formatPKR(product.price)}</div>
          <div className="text-xs text-muted-foreground mt-1">Ships within 5–7 business days · Nationwide delivery</div>

          <div className="mt-7 space-y-3">
            <button className="btn-primary w-full py-3.5">Add to cart</button>
            <button className="btn-ghost w-full py-3.5">Request customization</button>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-ghost">♡ Wishlist</button>
              <button className="btn-ghost">Message seller</button>
            </div>
          </div>

          {/* Trust */}
          <ul className="mt-7 text-xs space-y-2 border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
            {[
              "Protected payment — funds released after delivery window",
              "Careful, tracked shipping · insured above threshold",
              "Certificate of authenticity included",
              "7-day return window on eligible orders",
            ].map((t) => (
              <li key={t} className="flex gap-2 text-muted-foreground">
                <span style={{ color: "var(--success)" }}>✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>

          {/* Details */}
          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 text-xs border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
            {[
              ["Medium", product.medium],
              ["Dimensions", product.dimensions],
              ["Year", product.year.toString()],
              ["Framed", product.framed ? "Yes" : "No"],
              ["Colour", product.colours.join(", ")],
              ["Best for", product.room.join(", ")],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow">{k}</dt>
                <dd className="mt-1 text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Story */}
      <section className="border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="container-editorial py-16 grid lg:grid-cols-[1fr_1.5fr] gap-12">
          <div>
            <div className="eyebrow">The work</div>
            <h2 className="mt-3 font-display text-3xl">About this piece</h2>
          </div>
          <p className="text-[15px] leading-relaxed text-muted-foreground max-w-2xl">{product.description}</p>
        </div>
      </section>

      {/* Creator */}
      <section className="border-t" style={{ borderColor: "var(--color-border)", background: "var(--porcelain)" }}>
        <div className="container-editorial py-16 grid lg:grid-cols-[1fr_1.5fr] gap-12 items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg max-w-sm">
            <img src={creator.portrait} alt={creator.name} className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div>
            <div className="eyebrow">Creator</div>
            <h2 className="mt-3 font-display text-4xl">{creator.name}</h2>
            <div className="text-sm text-muted-foreground mt-1">{creator.discipline} · {creator.location}</div>
            <p className="mt-5 text-[15px] leading-relaxed max-w-2xl text-muted-foreground">{creator.bio}</p>
            <Link to="/creator/$slug" params={{ slug: creator.slug }} className="btn-ghost mt-6">Visit studio profile</Link>
          </div>
        </div>
      </section>

      {/* More by creator */}
      {more.length > 0 && (
        <section className="container-editorial pt-16">
          <div className="eyebrow">More from {creator.name.split(" ")[0]}'s studio</div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
            {more.slice(0, 4).map((p) => (<ProductCard key={p.slug} product={p} />))}
          </div>
        </section>
      )}

      {/* Similar */}
      {similar.length > 0 && (
        <section className="container-editorial pt-16">
          <div className="eyebrow">Similar in this category</div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
            {similar.map((p) => (<ProductCard key={p.slug} product={p} />))}
          </div>
        </section>
      )}
    </div>
  );
}
