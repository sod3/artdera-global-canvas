import { Link } from "@tanstack/react-router";
import { Eye, Heart, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/artdera";
import { CREATORS, formatPKR } from "@/lib/artdera";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ProductCard({ product }: { product: Product }) {
  const creator = CREATORS.find((c) => c.slug === product.creatorSlug);
  const [saved, setSaved] = useState(false);
  const secondaryImage = product.images[1] ?? product.images[0];

  return (
    <article className="group relative">
      <div className="relative overflow-hidden rounded-lg bg-secondary aspect-[4/5]">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          aria-label={`View ${product.title}`}
        >
          <img
            src={product.images[0]}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          />
          {secondaryImage !== product.images[0] && (
            <img
              src={secondaryImage}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.kind === "Original" && (
            <span className="chip" style={{ background: "var(--ink)", color: "var(--ivory)" }}>
              Original
            </span>
          )}
          {product.kind === "Limited Edition" && (
            <span className="chip" style={{ background: "var(--porcelain)", color: "var(--ink)" }}>
              Ed. {product.editionOf}
            </span>
          )}
          {product.kind === "AI-assisted" && (
            <span
              className="chip"
              style={{ background: "var(--indigo)", color: "var(--porcelain)" }}
            >
              AI-assisted
            </span>
          )}
          {product.new && (
            <span className="chip" style={{ background: "var(--terracotta)", color: "var(--ink)" }}>
              New
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setSaved((value) => !value)}
            aria-pressed={saved}
            aria-label={
              saved ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--porcelain)]/92 text-[var(--ink)] shadow-sm transition hover:scale-105"
          >
            <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex translate-y-3 gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
          <ProductQuickView product={product} />
          <a
            href="/cart"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--porcelain)] text-[var(--ink)] shadow-sm transition hover:bg-white"
            aria-label={`Add ${product.title} to cart`}
          >
            <ShoppingBag className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="mt-3.5">
        <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
          <span className="truncate">{creator?.name}</span>
          {creator?.verified && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[var(--indigo)]">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="mt-0.5 block font-display text-lg leading-snug hover:underline"
        >
          {product.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold">{formatPKR(product.price)}</span>
          <span className="text-muted-foreground">{product.medium.split(" on ")[0]}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
          <span>{product.framed ? "Framed" : "Unframed"}</span>
          <span aria-hidden>/</span>
          <span>{product.dimensions}</span>
          <span aria-hidden>/</span>
          <span>Ships 5-7 days</span>
        </div>
      </div>
    </article>
  );
}

function ProductQuickView({ product }: { product: Product }) {
  const creator = CREATORS.find((c) => c.slug === product.creatorSlug);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--porcelain)] px-4 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:bg-white"
        >
          <Eye className="h-4 w-4" />
          Quick view
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-3rem)] max-w-4xl overflow-y-auto rounded-2xl bg-[var(--porcelain)] p-0 sm:rounded-2xl">
        <div className="grid md:grid-cols-[0.95fr_1fr]">
          <div className="relative min-h-[320px] bg-secondary">
            <img
              src={product.images[0]}
              alt={product.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="p-6 md:p-8">
            <DialogHeader className="text-left">
              <div className="flex flex-wrap gap-2">
                <span className="chip" style={{ background: "var(--ink)", color: "var(--ivory)" }}>
                  {product.kind}
                  {product.editionOf ? ` / Ed. of ${product.editionOf}` : ""}
                </span>
                {product.kind === "AI-assisted" && (
                  <span
                    className="chip"
                    style={{ background: "var(--indigo)", color: "var(--porcelain)" }}
                  >
                    <Sparkles className="h-3 w-3" /> AI disclosed
                  </span>
                )}
              </div>
              <DialogTitle className="mt-4 font-display text-3xl font-normal leading-tight">
                {product.title}
              </DialogTitle>
              <DialogDescription>
                by {creator?.name} / {creator?.location}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 font-display text-3xl">{formatPKR(product.price)}</div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-xs">
              {[
                ["Type", product.kind],
                ["Dimensions", product.dimensions],
                ["Medium", product.medium],
                ["Framing", product.framed ? "Framed" : "Unframed"],
                ["Delivery", "5-7 business days"],
                ["Disclosure", product.kind === "AI-assisted" ? "AI-assisted" : "Creator declared"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="eyebrow">{label}</dt>
                  <dd className="mt-1 text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <a href="/cart" className="btn-primary">
                Add to Cart
              </a>
              <Link to="/product/$slug" params={{ slug: product.slug }} className="btn-ghost">
                View Full Details
              </Link>
            </div>
            <button type="button" className="btn-ghost mt-3 w-full">
              <Heart className="h-4 w-4" /> Wishlist
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
